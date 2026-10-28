// eslint custom rule: no-raw-radix
export default {
  meta: { type: 'problem', docs: { description: 'no-raw-radix' } },
  create(context) {
    return {
      Literal(_node) {},
      ImportDeclaration(node) {
        if (String(node.source.value).startsWith('@radix-ui')) context.report({ node, message: 'erp/no-raw-radix: import via @erp/ui primitives' });
      },
    };
  },
};
