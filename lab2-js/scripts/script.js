console.log("Whoa");

let answer = Math.floor(Math.random() * 100) + 1;

let guesses;

let attemptsLeft = 7;

let winMessage = "Congratulations! You guessed the number!";

const guessInput = document.querySelector("#guessInput");
const guessButton = document.querySelector("#guessButton");
const retryButton = document.querySelector("#retryButton");
const attemptsDisplay = document.querySelector("#attemptsLeft");
const hintText = document.querySelector("#hintText");

//look up an element with an id of guessMessage (#guessMessage)
//and bind it to a variable named guessMessage
//period would be used looking up a class, but we are looking up an id so we use the hashtag
let guessMessage = document.querySelector("#guessMessage");

//making a function called showWin that will be called when the user guesses the number correctly
//named block of code that starts and ends with curly braces {}
// function showWin() {
//     //equals (=) in JS means change the value of the variable on the left to the value on the right.
//     //change the text inside an element
//     guessMessage.textContent = winMessage;
function showWin() {
    guessMessage.textContent = winMessage;
    guessMessage.classList.add("success");
    guessInput.classList.add("correct");
    guessButton.disabled = true;
}

function guessCheck() {
    console.log(guessInput.value);
    console.log(answer);

    if (guessInput.value == answer) {
        showWin();
        return true;
    }
    return false;
}

//     //style object is any element lets you change css properties of that element
//     //change the color of the text inside an element
//     guessMessage.style.color = "green";
//     guessMessage.style.fontWeight = "bold";
// }

//a function with parenteheses () after the name of the function is called a function call
//showWin();

//This makes the button with the id of guessButton clickable and when clicked it will call the showWin function
// let guessButton = document.querySelector("#guessButton");
// guessButton.addEventListener("click", showWin)

//shorthand
guessButton.addEventListener("click", function () {
    //guessMessage.textContent = winMessage;
    //guessMessage.style.color = "green";
    //guessMessage.style.fontWeight = "bold";
    if (guessCheck()) {
        return;
    }

    //if there is no equals then no change is made to the variable, it is just being read
    attemptsLeft -= 1;
    attemptsDisplay.textContent = attemptsLeft;
    console.log(attemptsLeft);

    if (attemptsLeft == 0) {
        console.log("You are out of attempts!");
        hintText.textContent = "You are out of attempts! The number was " + answer + ".";
        guessButton.disabled = true;
        guessInput.disabled = true;
        retryButton.hidden = false;
        guessMessage.classList.add("gameOver");
    } else if (guessInput.value < 1 || guessInput.value > 100) {
        console.log("Your guess is out of range!");
        hintText.textContent = "Your guess is out of range! Please guess a number between 1 and 100.";
    } else if (guessInput.value < answer) {
        console.log("Your guess is too low!");
        hintText.textContent = "Your guess is too low! Try a higher number.";
    } else {
        console.log("Your guess is too high!");
        hintText.textContent = "Your guess is too high! Try a lower number.";
    }
})

retryButton.addEventListener("click", function () {
    answer = Math.floor(Math.random() * 100) + 1;
    attemptsLeft = 7;
    attemptsDisplay.textContent = attemptsLeft;
    guessInput.value = "";
    guessInput.disabled = false;
    guessInput.classList.remove("correct");
    guessButton.disabled = false;
    retryButton.hidden = true;
    hintText.textContent = "The number is between 1 and 100.";
    guessMessage.classList.remove("gameOver", "success");
    guessMessage.firstChild.textContent = "Hint: ";
});



