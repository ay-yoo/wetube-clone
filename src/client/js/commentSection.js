const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
const deleteBtns = document.querySelectorAll(".delete-message");

const addComment = (text, id) => {
  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  newComment.dataset.id = id;
  newComment.className = "video__comment";
  const icon = document.createElement("i");
  icon.className = "fas fa-comment";
  const span = document.createElement("span");
  span.innerText = `${text}`;
  const deleteBtn = document.createElement("span");
  deleteBtn.className = "fas fa-solid fa-ban delete-message";
  deleteBtn.addEventListener("click", handleDelete);
  newComment.appendChild(icon);
  newComment.appendChild(span);
  newComment.appendChild(deleteBtn);
  videoComments.prepend(newComment);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const textarea = form.querySelector("textarea");
  const videoId = videoContainer.dataset.id;
  const text = textarea.value;
  if (text === "") {
    return;
  }
  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
    }),
  });
  if (response.status === 201) {
    const { newCommentId } = await response.json();
    textarea.value = "";
    addComment(text, newCommentId);
  }
};

const handleDelete = async (event) => {
  const videoId = videoContainer.dataset.id;
  const videoComment = event.target.closest(".video__comment");
  const commentId = videoComment.dataset.id;
  const response = await fetch(`/api/videos/${videoId}/comment/${commentId}`, {
    method: "DELETE",
  });
  if (response.status === 200) {
    videoComment.remove();
  } else {
    location.reload();
  }
};

if (form) {
  form.addEventListener("submit", handleSubmit);
}

deleteBtns.forEach((button) => {
  button.addEventListener("click", handleDelete);
});
