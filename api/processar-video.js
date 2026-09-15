import { put } from '@vercel/blob';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegPath);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Lógica de recebimento do vídeo, compressão via FFmpeg
  // e upload final para o Vercel Blob

  return res.status(200).json({ status: 'Vídeo processado com sucesso' });
}
