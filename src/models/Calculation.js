export class Calculation {
  constructor({
    id,
    product_id,
    unit_id,
    selling_price,
    cost_price,
    profit_amount,
    profit_percentage,
    created_at
  }) {
    this.id = id;
    this.product_id = product_id;
    this.unit_id = unit_id;
    this.selling_price = selling_price;
    this.cost_price = cost_price;
    this.profit_amount = profit_amount;
    this.profit_percentage = profit_percentage;
    this.created_at = created_at;
  }

  toMap() {
    return {
      product_id: this.product_id,
      unit_id: this.unit_id,
      selling_price: this.selling_price,
      cost_price: this.cost_price,
      profit_amount: this.profit_amount,
      profit_percentage: this.profit_percentage,
      created_at: this.created_at
    };
  }

  static fromMap(map) {
    return new Calculation({
      id: map.id,
      product_id: map.product_id,
      unit_id: map.unit_id,
      selling_price: map.selling_price,
      cost_price: map.cost_price,
      profit_amount: map.profit_amount,
      profit_percentage: map.profit_percentage,
      created_at: map.created_at
    });
  }
}