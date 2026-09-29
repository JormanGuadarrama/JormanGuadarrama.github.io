document.querySelector("#submitQuiz").addEventListener("click", gradeQuiz);

const correctImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ctext y='16' font-size='18'%3E✓%3C/text%3E%3C/svg%3E";
const wrongImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ctext y='16' font-size='18'%3E✗%3C/text%3E%3C/svg%3E";

function addRadioChoices() {
    const choices = shuffleArray(["select", "option", "menu"]);
    const container = document.querySelector("#q1Choices");

    choices.forEach((choice) => {
        const label = document.createElement("label");
        label.innerHTML = `<input type="radio" name="q1" value="${choice}"> ${choice}`;
        container.append(label, document.createElement("br"));
    });
}

addRadioChoices();
document.querySelector("#attempts").textContent = `Total times quiz taken: ${Number(localStorage.getItem("quizAttempts") || 0)}`;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
         let j = Math.floor(Math.random() * (i + 1));
         [ array[i], array[j] ] = [ array[j], array[i] ];
     }
     return array;
}


function gradeQuiz(){
    let score = 0;
    const answers = {
        1: document.querySelector("input[name=q1]:checked")?.value || "",
        2: document.querySelector("#q2").value.trim().toLowerCase(),
        3: document.querySelector("#q3").value,
        4: document.querySelector("#q4").value,
        5: [...document.querySelectorAll("input[name=q5]:checked")].map((input) => input.value).sort()
    };
    const correct = {
        1: "select",
        2: "css",
        3: "h1",
        4: "2",
        5: ["h1", "p"]
    };

    for (let question = 1; question <= 5; question++) {
        const isCorrect = Array.isArray(correct[question])
            ? JSON.stringify(answers[question]) === JSON.stringify(correct[question].sort())
            : answers[question] === correct[question];
        showFeedback(question, isCorrect);
        if (isCorrect) score += 20;
    }

    const attempts = Number(localStorage.getItem("quizAttempts") || 0) + 1;
    localStorage.setItem("quizAttempts", attempts);
    document.querySelector("#score").textContent = `Score: ${score}/100`;
    document.querySelector("#attempts").textContent = `Total times quiz taken: ${attempts}`;
    document.querySelector("#congratulations").textContent = score > 80 ? "Congratulations!" : "";
}

function showFeedback(question, isCorrect) {
    const feedback = document.querySelector(`#feedback${question}`);
    feedback.className = isCorrect ? "correct" : "wrong";
    feedback.innerHTML = `<img src="${isCorrect ? correctImage : wrongImage}" alt="${isCorrect ? "Correct" : "Incorrect"}"> ${isCorrect ? "Correct!" : "Incorrect."}`;
}
