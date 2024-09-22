export class ButtonElement {
  public displayName: string;
  value: any;
  children?: ButtonLayers;
  public color?: string;
  constructor({name = '', value = null, children, color}:Partial<ButtonLayersSetting> ) {
    this.displayName = name;
    this.value = value;
    this.children = children;
    this.color = color;
  }
}
interface ButtonLayersSetting {
  name: string;
  value: any;
  children?: ButtonLayers;

  color?: string
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
