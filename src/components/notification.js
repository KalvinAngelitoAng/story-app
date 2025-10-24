const Notification = {
  show({ message, type = 'success' }) {
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification ${type}`;
    notificationElement.textContent = message;

    document.body.appendChild(notificationElement);

    // Show notification
    setTimeout(() => {
      notificationElement.classList.add('show');
    }, 10); // Small delay to allow for CSS transition

    // Hide and remove notification after 3 seconds
    setTimeout(() => {
      notificationElement.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notificationElement);
      }, 300); // Wait for fade out transition to finish
    }, 3000);
  },
};

export default Notification;
