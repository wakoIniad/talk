export class ButtonElement {
  public displayName: string;
  value: any;
  children?: ButtonLayers;
  constructor({name = '', value = null, children}:Partial<ButtonLayersSetting> ) {
    this.displayName = name;
    this.value = value;
    this.children = children;
  }
}
interface ButtonLayersSetting {
  name: string;
  value: any;
  children?: ButtonLayers;
}
export class ButtonLayers extends Array{
  public elements: Array<ButtonElement>;
  depth: number;
  constructor(...elements: (ButtonElement)[]) {

    super(elements.length);
    this.elements = elements;
    this.depth = 0;
    this.upDateIndex(elements);
    elements.forEach((elm, i) => {
      this[i] = elm;
    })
  }
  upDateIndex(elements: Array<ButtonElement>) {
    for(const element of elements) {
      if(element.children) {
        this.upDateIndex(element.children!.elements);
        element.children!.depth += 1;
      }
    }
  }

  append(...elements: Array<ButtonElement>) {
    this.push(...elements);
    this.elements.push(...elements);
  }
}
