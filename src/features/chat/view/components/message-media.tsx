import type { Content } from "../../model/message.model";

type MessageMediaProps = { content: Content };

export const MessageMedia = ({ content }: MessageMediaProps) => {
  if (content.kind === "image") {
    return (
      <img
        src={content.uri}
        alt="Imagem gerada pela IA"
        className="max-h-96 w-full rounded-xl object-contain"
      />
    );
  }

  if (content.kind === "video") {
    if (content.status === "ready" && content.uri) {
      return <video src={content.uri} controls className="max-h-96 w-full rounded-xl" />;
    }
    if (content.status === "failed") {
      return (
        <span className="text-xs text-danger">
          Falha ao gerar o vídeo: {content.failureReason ?? "erro desconhecido"}.
        </span>
      );
    }
    return <span className="text-xs text-ink-muted">Gerando vídeo…</span>;
  }

  return null;
};
