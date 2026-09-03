export class Product {
  constructor(id, name, createdAt) {
    this.id = id;
    this.name = name;
    this.createdAt = createdAt;
  }

  toMap() {
    return {
      name: this.name,
      created_at: this.createdAt
    };
  }

  static fromMap(map) {
    return new Product(
      map.id,
      map.name,
      map.created_at
    );
  }
}