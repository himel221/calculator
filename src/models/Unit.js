export class Unit {
  constructor(id, label, symbol, type) {
    this.id = id;
    this.label = label;
    this.symbol = symbol;
    this.type = type; // 'currency' or 'percentage'
  }

  toMap() {
    return {
      label: this.label,
      symbol: this.symbol,
      type: this.type
    };
  }

  static fromMap(map) {
    return new Unit(
      map.id,
      map.label,
      map.symbol,
      map.type
    );
  }
}