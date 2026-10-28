// eslint custom rule: import-path
export default {
  meta: { type: 'problem', docs: { description: 'import-path' } },
  create(context) {
    return {
      Literal(_node) {},
      ImportDeclaration(node) {
        if (String(node.source.value).startsWith('@erp/ui/') && node.source.value !== '@erp/ui') context.report({ node, message: 'erp/import-path: use @erp/ui barrel' });
      },
    };
  },
};
