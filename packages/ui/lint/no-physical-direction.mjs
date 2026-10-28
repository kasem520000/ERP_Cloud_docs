// eslint custom rule: no-physical-direction
export default {
  meta: { type: 'problem', docs: { description: 'no-physical-direction' } },
  create(context) {
    const srcCode = context.getSourceCode();
    return {
      Literal(node) {
        try {
          const lineText = srcCode.lines[node.loc.start.line-1] || '';
          if (lineText.includes('rtl-exempt')) return;
        } catch {}
        const v = String(node.value ?? '');
        const banned = ['pl-','pr-','ml-','mr-','text-left','text-right','left-','right-','border-l-','border-r-'];
        if (banned.some(b => v.includes(b))) context.report({ node, message: 'erp/no-physical-direction: use logical ms/me/ps/pe/text-start/end' });
      },
      ImportDeclaration(node) {},
    };
  },
};
