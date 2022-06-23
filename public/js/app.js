function deletePost(postId) {
  fetch(
    `/posts/${postId}/`,
    {
      method: "DELETE"
    }
  )
}

document.addEventListener("DOMContentLoaded", function () {
  // Add your JavaScript here.
});
