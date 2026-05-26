type ImageContentProps = {
  uri: string;
  mimeType: string;
  width?: number;
  height?: number;
};

export class ImageContent {
  readonly kind = "image" as const;

  private constructor(private readonly props: ImageContentProps) {}

  static of(props: ImageContentProps): ImageContent {
    if (props.uri.trim().length === 0) {
      throw new InvalidImageContentError("uri is required.");
    }
    if (props.mimeType.trim().length === 0) {
      throw new InvalidImageContentError("mimeType is required.");
    }
    if ((props.width !== undefined && props.width <= 0) || (props.height !== undefined && props.height <= 0)) {
      throw new InvalidImageContentError("width and height must be positive when given.");
    }
    return new ImageContent(props);
  }

  get uri(): string {
    return this.props.uri;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get width(): number | undefined {
    return this.props.width;
  }

  get height(): number | undefined {
    return this.props.height;
  }
}

export class InvalidImageContentError extends Error {
  constructor(reason: string) {
    super(`Invalid ImageContent: ${reason}`);
    this.name = "InvalidImageContentError";
  }
}
