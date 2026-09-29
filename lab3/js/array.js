let newParagraph = document.createElement("p");
newParagraph.textContent = "The answer is right!";
newParagraph.id = "rightAnswer";

let insertedParagraph = document.querySelector("#footer");
insertedParagraph.append(newParagraph);

let names = ["mario", "luma", "rosalina", "yoshi"];

for (let name of names) {
	let paragraph = document.createElement("p");
	paragraph.textContent = name;
	insertedParagraph.append(paragraph);
}

