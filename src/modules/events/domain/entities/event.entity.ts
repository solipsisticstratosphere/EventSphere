export class Event {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly date: Date,
    public readonly location: string,
    public readonly price: number,
    public readonly userId: string,
    public readonly image?: string,
    public readonly images: string[] = [],
    public readonly thumbnailUrl?: string,
    public readonly category?: string,
    public readonly status: string = "ACTIVE",
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static fromPrisma(data: any): Event {
    return new Event(
      data.id,
      data.title,
      data.description,
      new Date(data.date),
      data.location,
      data.price,
      data.userId,
      data.image,
      data.images || [],
      data.thumbnailUrl,
      data.category,
      data.status || "ACTIVE",
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  isPast(): boolean {
    return this.date < new Date();
  }

  canBePurchased(): boolean {
    return this.status === "ACTIVE" && !this.isPast();
  }

  addImage(imageUrl: string): Event {
    return new Event(
      this.id,
      this.title,
      this.description,
      this.date,
      this.location,
      this.price,
      this.userId,
      this.image,
      [...this.images, imageUrl],
      this.thumbnailUrl,
      this.category,
      this.status,
      this.createdAt,
      this.updatedAt
    );
  }

  removeImage(imageUrl: string): Event {
    return new Event(
      this.id,
      this.title,
      this.description,
      this.date,
      this.location,
      this.price,
      this.userId,
      this.image,
      this.images.filter((url) => url !== imageUrl),
      this.thumbnailUrl,
      this.category,
      this.status,
      this.createdAt,
      this.updatedAt
    );
  }
}



