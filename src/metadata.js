import { exec } from "child_process";

export const fetchMetadata = (url) => {
  return new Promise((resolve, reject) => {
    const cmd = `yt-dlp -J "${url}"`;
    exec(cmd, { maxBuffer: 1024 * 500 }, (err, stdout, stderr) => {
      if (err) return reject(stderr);
      const data = JSON.parse(stdout);
      const formats = data.formats.map((f) => ({
        format_id: f.format_id,
        ext: f.ext,
        resolution: f.height ? `${f.height}p` : f.format_note,
        filesize: f.filesize || null,
        audio: !!f.acodec,
        video: !!f.vcodec,
      }));
      resolve({
        title: data.title,
        duration: data.duration,
        formats,
        thumbnail: data.thumbnails,
      });
    });
  });
};
