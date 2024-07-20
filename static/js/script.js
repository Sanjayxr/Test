document.addEventListener("DOMContentLoaded", function () {
  fetchDataAndUpdateUI();
});

function startListening() {
  const recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = function () {
    document.getElementById("status").innerText = "Listening...";
    console.log("Microphone is on, start speaking...");
  };

  recognition.onspeechend = function () {
    recognition.stop();
    document.getElementById("status").innerText = "Processing...";
    console.log("Speech ended, processing...");
  };

  recognition.onresult = function (event) {
    const speechText = event.results[0][0].transcript;
    document.getElementById("status").innerText = "You said: " + speechText;
    console.log("Recognized text:", speechText);
    processSpeech(speechText);
  };

  recognition.onerror = function (event) {
    let errorMessage = "Error occurred in recognition: " + event.error;
    switch (event.error) {
      case "network":
        errorMessage = "Network error: Please check your internet connection.";
        break;
      case "not-allowed":
        errorMessage = "Permission error: Please allow microphone access.";
        break;
      case "service-not-allowed":
        errorMessage = "Service error: The recognition service is not allowed.";
        break;
      case "no-speech":
        errorMessage = "No speech detected: Please try again.";
        break;
      default:
        errorMessage = "An unknown error occurred: " + event.error;
    }
    console.error(errorMessage);
    document.getElementById("status").innerText = errorMessage;
  };

  recognition.start();
}

function processSpeech(speechText) {
  const formData = new FormData();
  formData.append("speech_text", speechText);

  fetch("/process", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      updateTable(data);
    })
    .catch((error) => console.error("Error:", error));
}

function fetchDataAndUpdateUI() {
  fetch("/data")
    .then((response) => response.json())
    .then((data) => {
      updateTable(data);
    })
    .catch((error) => console.error("Error:", error));
}

function updateTable(data) {
  const tableBody = document
    .getElementById("treeTable")
    .getElementsByTagName("tbody")[0];
  tableBody.innerHTML = "";
  data.forEach((tree) => {
    const row = tableBody.insertRow();
    row.insertCell(0).innerText = tree["Tree Name"];
    row.insertCell(1).innerText = tree["Status"];
    const colorCell = row.insertCell(2);
    colorCell.innerText = tree["Color"];
    colorCell.style.backgroundColor = tree["Color"];
    const deleteCell = row.insertCell(3);
    const deleteButton = document.createElement("button");
    deleteButton.innerText = "Delete";
    deleteButton.onclick = function () {
      deleteTree(tree["Tree Name"]);
    };
    deleteCell.appendChild(deleteButton);
  });
}

function deleteTree(treeName) {
  const formData = new FormData();
  formData.append("tree_name", treeName);

  fetch("/delete", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      updateTable(data);
    })
    .catch((error) => console.error("Error:", error));
}
