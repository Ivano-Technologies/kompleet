// Repository pattern for typed database access
// No UI imports, pure data layer
export class Repository<T> {
  constructor(private tableName: string) {}

  async findById(id: string): Promise<T | null> {
    // Implementation will be added
    return null;
  }

  async findAll(): Promise<T[]> {
    // Implementation will be added
    return [];
  }

  async create(data: Partial<T>): Promise<T> {
    // Implementation will be added
    throw new Error("Not implemented");
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    // Implementation will be added
    throw new Error("Not implemented");
  }

  async delete(id: string): Promise<boolean> {
    // Implementation will be added
    return false;
  }
}
