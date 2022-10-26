import { RabbitmqServer } from "../rabbitmq.server";
import ytdl from "ytdl-core";
import { join } from "path";
import fs from "fs";

export class DownloaderController {
  async downloadMp3(msg: any) {
    try {
      if (!msg) return;

      const parsedContent = JSON.parse(msg.content.toString());

      const { url } = parsedContent;

      const info = await ytdl.getBasicInfo(url);

      const title = info.videoDetails.title.replace("/", "");

      const path = `${process.cwd()}/src/downloads/`;
      const newFilename = `${title}.mp3`;

      const pathfile = join(path, newFilename);
      console.log(pathfile);

      ytdl(url, { quality: "highestaudio", filter: "audioonly" })
        .pipe(fs.createWriteStream(pathfile))
        .on("finish", () => {
          console.log(`finished: ${newFilename}`);
        })
        .on("drain", () => console.log("drain"))
        .on("error", (error) => {
          console.error(error);
        })
        .on("ready", () => console.log(`started ${newFilename}`));

      RabbitmqServer.getInstance().ack(msg);
    } catch (error) {
      RabbitmqServer.getInstance().nack(msg);
    }
  }
}
