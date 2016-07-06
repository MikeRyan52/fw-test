declare module 'yo-yo' {
  interface YoYo {
    (strings: TemplateStringsArray, ...substitutions: any[]): Element;
    update(targetElement: Element, newElement: Element);
  }

  const yo: YoYo;

  export = yo;
}
