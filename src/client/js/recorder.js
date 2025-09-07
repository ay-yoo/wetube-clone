import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const actionBtn = document.getElementById("startBtn");
const video = document.getElementById("preview");

let stream;
let recorder;
let videoFile;

const downloadFile = (fileUrl, fileName) => {
  const a = document.createElement("a");
  a.href = fileUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
};
const files = {
  input: "recording.webm",
  output: "output.mp4",
  thumb: "thumbnail.jpg",
};
const handleDownload = async () => {
  actionBtn.removeEventListener("click", handleDownload);
  actionBtn.innerText = "Transcoding..";
  actionBtn.disabled = true;
  const ffmpeg = new FFmpeg({ log: true });
  await ffmpeg.load();

  await ffmpeg.writeFile(files.input, await fetchFile(videoFile));
  await ffmpeg.exec(["-i", files.input, "-r", "60", files.output]);
  await ffmpeg.exec([
    "-i",
    files.input,
    "-ss",
    "00:00:01",
    "-frames:v",
    "1",
    files.thumb,
  ]);

  const mp4Data = await ffmpeg.readFile(files.output);
  const thumbData = await ffmpeg.readFile(files.thumb);

  const mp4Blob = new Blob([mp4Data], { type: "video/mp4" });
  const thumbNailBlob = new Blob([thumbData], { type: "image/jpg" });

  const mp4Url = URL.createObjectURL(mp4Blob);
  const thumbUrl = URL.createObjectURL(thumbNailBlob);

  downloadFile(mp4Url, "MyRecording.mp4");
  downloadFile(thumbUrl, "MyThumbnail.jpg");

  actionBtn.disabled = false;
  actionBtn.innerText = "Record Again";
  actionBtn.addEventListener("click", handleStart);
};

const handleStop = () => {
  actionBtn.innerText = "download recording";
  actionBtn.removeEventListener("click", handleStop);
  actionBtn.addEventListener("click", handleDownload);
  recorder.stop();
};
const handleStart = () => {
  actionBtn.innerText = "stop recording";
  actionBtn.removeEventListener("click", handleStart);
  actionBtn.addEventListener("click", handleStop);
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (event) => {
    videoFile = URL.createObjectURL(event.data);
    video.srcObject = null;
    video.src = videoFile;
    video.loop = true;
    video.play();
  };
  recorder.start();
};

const init = async () => {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true,
  });
  video.srcObject = stream;
  video.play();
};
init();
actionBtn.addEventListener("click", handleStart);
