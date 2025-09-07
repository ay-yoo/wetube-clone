import User from "../models/User";
import Video from "../models/Video";
import Comment from "../models/Comment";

export const home = async (req, res) => {
  const videos = await Video.find({})
    .sort({ createdAt: "desc" })
    .populate("owner");
  return res.render("home", { pageTitle: "Home", videos });
};

export const watch = async (req, res) => {
  const id = req.params.id;
  const video = await Video.findById(id).populate("owner").populate("comments");
  console.log(video);
  if (video) {
    return res.render("videos/watch", {
      pageTitle: video.title,
      video,
    });
  }
  return res.render("404", { pageTitle: "video not found" });
};

export const getEdit = async (req, res) => {
  const id = req.params.id;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (video === null) {
    return res.status(400).render("404", { pageTitle: "video not found" });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "Not authorized");
    return res.status(403).redirect("/");
  }
  return res.render("videos/edit", {
    pageTitle: `edit: ${video.title} `,
    video: video,
  });
};

export const postEdit = async (req, res) => {
  const id = req.params.id;
  const {
    user: { _id },
  } = req.session;
  const { title, description, hashtags } = req.body;
  const video = await Video.findById(id);
  if (video === null) {
    return res.render("404", { pageTitle: "video not found" });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "You are not the owner of the video");
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndUpdate(id, {
    title: title,
    description: description,
    hashtags: Video.formatHashtags(hashtags),
  });
  return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
  return res.render("videos/upload", { pageTitle: "upload Video" });
};

export const postUpload = async (req, res) => {
  const {
    user: { _id },
  } = req.session;
  const { video, thumb } = req.files;
  const { title, description, hashtags } = req.body;
  try {
    const newVideo = await Video.create({
      title: title,
      description: description,
      fileUrl: video[0].path,
      thumbUrl: thumb[0].path,
      owner: _id,
      hashtags: Video.formatHashtags(hashtags),
      meta: {
        views: 0,
        rating: 0,
      },
    });
    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();
  } catch (error) {
    console.error("❗️description for video upload error", error.errors);
    return res.render("videos/upload", {
      pageTitle: "upload Video",
      errorMessage: error._message,
    });
  }

  return res.redirect("/");
};

export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res.render("404", { pageTitle: "video not found" });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "Not authorized");
    return res.status(403).redirect("/");
  }

  await Video.findByIdAndDelete(id);
  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    videos = await Video.find({
      title: {
        $regex: new RegExp(keyword, "i"),
      },
    }).populate("owner");
  }
  return res.render("search", { pageTitle: "Search", videos });
};

export const registerView = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  video.meta.views = video.meta.views + 1;
  await video.save();
  return res.sendStatus(200);
};

export const createComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const {
    session: { user },
  } = req;
  const dbUser = await User.findById(user._id);
  if (!dbUser) {
    return res.sendStatus(404);
  }
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  const comment = await Comment.create({
    text,
    owner: user._id,
    video: id,
  });
  video.comments.push(comment._id);
  await video.save();
  dbUser.comments.push(comment._id);
  await dbUser.save();

  return res.status(201).json({ newCommentId: comment._id });
};

export const deleteComment = async (req, res) => {
  const videoId = req.params.id;
  const { commentId } = req.params;
  const {
    session: { user },
  } = req;
  if (!user) {
    req.flash("error", "Not authorized");
    return res.sendStatus(403);
  }
  const comment = await Comment.findById(commentId);
  const commentUserId = comment.owner;
  if (String(commentUserId) != String(user._id)) {
    req.flash("error", "Not authorized");
    return res.sendStatus(403);
  }
  await Video.findByIdAndUpdate(videoId, {
    $pull: { comments: commentId },
  });
  await User.findByIdAndUpdate(commentUserId, {
    $pull: { comments: commentId },
  });
  await Comment.findByIdAndDelete(commentId);
  return res.sendStatus(200);
};
