import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

import { ZodError } from "zod";

import { DomainError } from "@erp/domain-core";

import { getCorrelationId } from "../observability/request-context";
import { setRetryAfter } from "./envelope";
import {
  AccountLockedError,
  ForbiddenError,
  InvalidCredentialsError,
  InvalidResetTokenError,
  InvalidTotpCodeError,
  InvitationNotAcceptableError,
  MfaRequiredError,
  NotFoundError,
  RateLimitedError,
  StaleVersionError,
  TenantContextRequiredError,
  TenantSuspendedError,
  UnauthenticatedError,
} from "../../modules/identity/domain/identity-errors";
import { InvalidAuditEventError } from "../../modules/audit/api/audit";
import { WeakPasswordError } from "../../modules/identity/domain/password-policy";
import {
  BranchCodeTakenError,
  BranchNotActiveError,
  BranchScopeViolationError,
  EmailAlreadyRegisteredError,
  FeatureDependenciesMissingError,
  FeatureNotEntitledError,
  InvalidRegistrationInputError,
  InvalidTenantTransitionError,
  ManualGrantExpiryRequiredError,
  PlanClosureInvalidError,
  PlanNotFoundError,
  SupportAccessDeniedError,
  SupportSessionExpiredError,
  SupportSessionNotActiveError,
  UnknownFeatureKeyError,
} from "../../modules/tenancy/domain/tenancy-errors";
import {
  InvalidSettingValueError,
  UnknownSettingKeyError,
} from "../../modules/configuration/api";

/**
 * ERROR_MODEL exception filter: the single error envelope —
 * `{ error: { code, message, details, traceId, retryable } }`. Codes are
 * contracts; messages are display-only. Domain errors map to their stable
 * HTTP statuses (§2); lockout stays indistinguishable from credential
 * failure (§5.2); 429 always carries Retry-After; anything unmapped is a
 * 500 INTERNAL_ERROR that never leaks internals.
 */

const log = new Logger("http-errors");

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
  retryable: boolean;
}

interface ErrorEnvelope {
  error: ErrorBody & { traceId: string };
}

@Catch()
export class ErrorModelFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const { status, body, retryAfter } = this.map(exception);

    if (status >= 500) {
      log.error(exception instanceof Error ? exception.stack : String(exception));
    } else {
      log.debug(
        `http ${status} ${body.code} — ${exception instanceof Error ? exception.message : String(exception)}`,
      );
    }
    if (retryAfter !== undefined) {
      setRetryAfter(response, retryAfter);
    }
    const envelope: ErrorEnvelope = {
      error: { ...body, traceId: getCorrelationId() ?? "" },
    };
    response.status(status).json(envelope);
  }

  private map(exception: unknown): { status: number; body: ErrorBody; retryAfter?: number } {
    if (exception instanceof ZodError) {
      // API_CONVENTIONS §3: unknown/malformed fields are rejected loudly —
      // zod issues surface as typed fieldErrors inside details.
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        body: {
          code: "VALIDATION_ERROR",
          message: "request payload failed validation",
          details: {
            fieldErrors: exception.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
              code: issue.code,
            })),
          },
          retryable: false,
        },
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (exception instanceof InternalServerErrorException) {
        return internal();
      }
      return {
        status,
        body: {
          code: nestCode(status),
          message: exception.message,
          retryable: status >= 500,
        },
      };
    }
    if (exception instanceof DomainError) {
      return { status: domainStatus(exception), body: fromDomain(exception), retryAfter: retryAfterOf(exception) };
    }
    return internal();
  }
}

function internal(): { status: number; body: ErrorBody } {
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    body: { code: "INTERNAL_ERROR", message: "internal server error", retryable: true },
  };
}

function nestCode(status: number): string {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return "UNAUTHENTICATED";
    case HttpStatus.FORBIDDEN:
      return "FORBIDDEN";
    case HttpStatus.NOT_FOUND:
      return "NOT_FOUND";
    case HttpStatus.CONFLICT:
      return "STALE_VERSION";
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return "VALIDATION_ERROR";
    case HttpStatus.SERVICE_UNAVAILABLE:
      return "SERVICE_UNAVAILABLE";
    case HttpStatus.BAD_REQUEST:
      return "BAD_REQUEST";
    default:
      return "INTERNAL_ERROR";
  }
}

function domainStatus(error: DomainError): number {
  if (
    error instanceof InvalidCredentialsError ||
    error instanceof AccountLockedError ||
    error instanceof UnauthenticatedError
  ) {
    return HttpStatus.UNAUTHORIZED;
  }
  if (error instanceof RateLimitedError) {
    return HttpStatus.TOO_MANY_REQUESTS;
  }
  if (error instanceof MfaRequiredError) {
    return HttpStatus.LOCKED; // 423 per ERROR_MODEL §2
  }
  if (
    error instanceof ForbiddenError ||
    error instanceof TenantContextRequiredError ||
    error instanceof WeakPasswordError ||
    error instanceof BranchScopeViolationError ||
    error instanceof BranchNotActiveError ||
    error instanceof FeatureNotEntitledError ||
    error instanceof SupportAccessDeniedError ||
    error instanceof SupportSessionExpiredError
  ) {
    return HttpStatus.FORBIDDEN;
  }
  if (error instanceof NotFoundError || error instanceof PlanNotFoundError) {
    return HttpStatus.NOT_FOUND;
  }
  if (
    error instanceof StaleVersionError ||
    error instanceof EmailAlreadyRegisteredError ||
    error instanceof BranchCodeTakenError ||
    error instanceof InvalidTenantTransitionError ||
    error instanceof SupportSessionNotActiveError
  ) {
    return HttpStatus.CONFLICT;
  }
  if (error instanceof TenantSuspendedError) {
    return HttpStatus.SERVICE_UNAVAILABLE;
  }
  if (
    error instanceof InvalidResetTokenError ||
    error instanceof InvalidTotpCodeError ||
    error instanceof InvitationNotAcceptableError ||
    error instanceof InvalidAuditEventError ||
    error instanceof UnknownSettingKeyError ||
    error instanceof InvalidSettingValueError ||
    error instanceof InvalidRegistrationInputError ||
    error instanceof FeatureDependenciesMissingError ||
    error instanceof UnknownFeatureKeyError ||
    error instanceof ManualGrantExpiryRequiredError ||
    error instanceof PlanClosureInvalidError
  ) {
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }
  return HttpStatus.UNPROCESSABLE_ENTITY;
}

function fromDomain(error: DomainError): ErrorBody {
  return {
    code: error.code,
    message: error.message,
    details: error.details,
    retryable: false,
  };
}

function retryAfterOf(error: DomainError): number | undefined {
  if (error instanceof RateLimitedError) {
    return error.retryAfterSeconds;
  }
  if (error instanceof AccountLockedError) {
    return error.retryAfterSeconds; // header only — body stays uniform (§5.2)
  }
  return undefined;
}
