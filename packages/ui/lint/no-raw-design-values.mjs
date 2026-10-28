// eslint custom rule: no-raw-design-values
export default {
  meta: { type: 'problem', docs: { description: 'no-raw-design-values' } },
  create(context) {
    const srcCode = context.getSourceCode();
    return {
      Literal(node) {
        try {
          const lineText = srcCode.lines[node.loc.start.line-1] || '';
          if (lineText.includes('rtl-exempt')) return;
        } catch {}
        const v = String(node.value ?? '');
        if (/^#[0-9A-Fa-f]{6}$/.test(v)) context.report({ node, message: 'erp/no-raw-design-values: use --erp-* tokens' });
      },
      ImportDeclaration(node) {},
    };
  },
};
