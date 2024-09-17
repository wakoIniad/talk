export class ButtonElement {
  displayName: string;
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
  elements: Array<ButtonElement>;
  index: number;
  constructor(...elements: (ButtonElement)[]) {
    super(elements.length);
    this.elements = elements;
    this.index = 0;
    this.upDateIndex(elements);
  }
  upDateIndex(elements: Array<ButtonElement>) {
    for(const element of elements) {
      if(element.children) {
        this.upDateIndex(element.children!.elements);
        element.children!.index += 1;
      }
    }
  }
}
