async function grab_data() {
    let request = new Request("selected.json")
    return fetch(request)
}


function choose_word(words) {
    let now = new Date
    let today = new Date(now.getFullYear(), now.getMonth(), now.getDay())
    let date_as_number = Number(today) * 1111
    return words[date_as_number % words.length]
}

function isLetterInWord(target, letter) {
    return target.split("").map(possibility => possibility == letter).reduce((a, b) => a || b)
}

function verifyWord(word, words) {
    for (let i = 0; i < words.length; i++) {
        if (words[i] == word) {
            return true
        }
    }
    return false
}

function guess(target, offering) {
    return offering.split("").map(function (letter, index) {
        if (target[index] == letter) {
            return [letter, 2]
        } else if (isLetterInWord(target, letter)) {
            return [letter, 1]
        } else {
            return [letter, 0]
        }
    })

}
alphabet = "abcdefghijklmnopqrstuvwxyz"
letterRows = ["qwertyuiop", "asdfghjkl", "zxcvbn"]
dvorakRows = ["qwertyuiop", "asdfghjkl", "zxcvbn"]

function prettyPrint(response) {
    let node = document.createElement("div")
    node.classList.add("guessResponseWord")
    response.forEach(r => {
        let letterNode = document.createElement("div")
        letterNode.innerHTML = r[0].toUpperCase()
        letterNode.classList.add("score" + r[1])
        node.appendChild(letterNode)
        letterNode.classList.add("guessResponseLetter")
    })
    document.getElementById("responses").appendChild(node)
}

function show_game(json) {
    let words = json["words"]
    let chosen = choose_word(words)
    display(chosen)
}

function updateLives(count) {
    document.getElementById("scoreCount").innerHTML = count
}

function Game() {
    this.loaded = false
    this.load = function (words) {
        this.word = choose_word(words)
        this.words = words
        this.loaded = true
    }
    this.word = ""
    this.words = []
    this.lives = 7
    this.won = false
    this.responses = []
    this.emojiResponses = function () {
        return this.responses.map(response => response.map(r => {
            switch (r[1]) {
                case 0:
                    return "⬜"
                case 1:
                    return "🟦"
                case 2:
                    return "🟩"
                case 3:
                    return "⬛"
            }
        }).reduce((a, b) => a + b, "")).reduce((a, b) => a + "\n" + b)
    }
    this.copyResponses = function () {
        text = this.emojiResponses()
        navigator.clipboard.writeText(text);
    }
    this.registerResponse = function (response) {
        this.responses.push(response)
        prettyPrint(response)
    }
    this.guess = function (attempt) {
        if (!this.loaded) {
            return false
        }
        if (this.won) {
            return false
        }
        if (attempt.length != this.word.length) {
            this.refreshUI()
            return false
        }
        if (this.lives == 0) {
            this.refreshUI()
            this.end()
            return false
        }
        if (!verifyWord(attempt, this.words)) {
            //this.lives -= 1
            let response = attempt.split("").map(letter => [letter, 3])
            this.registerResponse(response)
            this.refreshUI()
            return true
        }
        let response = guess(this.word, attempt)
        this.score = response.reduce((a, b) => a + b[1], 0) - 2 * this.word.length
        this.registerResponse(response)
        if (this.score == 0) {
            this.won = true
            this.refreshUI()
            this.end()
        } else {
            this.lives -= 1
            this.refreshUI()
        }
        return true
    }

    this.lettersUsed = function () {
        seen = {}
        alphabet.split("").forEach(letter => seen[letter] = -1)
        this.responses.forEach(response => response.forEach(r => {
            if (r[1] < 3) {
                seen[r[0]] = Math.max(seen[r[0]], r[1])
            }
        }))
        return seen
    }

    this.refreshUI = function () {
        updateLives(this.lives)

        letterDiv = document.getElementById("alphabet")

        letterDiv.innerHTML = ""

        let alphabetLabel = document.createElement("div")
        alphabetLabel.innerText = "Letters used so far"
        alphabetLabel.classList.add("scoreboard")
        alphabetLabel.classList.add("alphabetLabel")

        letterDiv.appendChild(alphabetLabel)

        let lettersUsed = this.lettersUsed()

        letterRows.forEach((row, rowIndex) => {
            let rowDiv = document.createElement("div")
            rowDiv.classList.add("keyboardRow")
            row.split("").forEach(letter => {
                let node = document.createElement("div")
                score = lettersUsed[letter]
                if (score > -1) {
                    node.classList.add("score" + score)
                } else {
                    node.classList.add("scoreUnused")
                }
                node.classList.add("alphabetLetter")
                node.innerText = letter
                node.addEventListener("click", event => { addLetter(letter) })
                rowDiv.appendChild(node)
            })
            letterDiv.appendChild(rowDiv)
        })
    }

    this.end = function () {

        if (this.won) {

            let responseArea = document.getElementById("responses")


            let congratsDiv = document.createElement("div")
            congratsDiv.innerText = "Congratulations!"
            congratsDiv.classList.add("scoreboard")
            congratsDiv.classList.add("congratulations")
            responseArea.appendChild(congratsDiv)

        } else if (this.lives == 0) {

            let responseArea = document.getElementById("responses")


            let commiserationDiv = document.createElement("div")
            commiserationDiv.innerText = "Commiserations! Try a new word tomorrow."
            commiserationDiv.classList.add("scoreboard")
            commiserationDiv.classList.add("congratulations")
            responseArea.appendChild(commiserationDiv)

        }


        if (this.lives == 0 || this.won) {

            let responseArea = document.getElementById("responses")


            let copyForm = document.createElement("form")
            copyForm.setAttribute("action", "#")
            copyForm.addEventListener("submit", event => {
                this.copyResponses()
                event.preventDefault()
            })

            let copyButton = document.createElement("input")
            copyButton.setAttribute("id", "copyButton")
            copyButton.setAttribute("type", "submit")
            copyButton.setAttribute("value", "Copy Grid")
            copyButton.setAttribute("tabindex", "0")

            copyForm.appendChild(copyButton)
            responseArea.appendChild(copyForm)

        }

        document.getElementById("inputButton").disabled = true
    }

    this.implementUI = function () {

        let display = document.getElementById("display")


        display.innerHTML = ""
        let responseArea = document.createElement("div")
        responseArea.classList.add("responseArea")
        responseArea.setAttribute("id", "responses")
        display.appendChild(responseArea)

        let scoreBoard = document.createElement("div")

        let scoreLabel = document.createElement("span")
        scoreLabel.innerHTML = "Guesses remaining: "
        scoreBoard.appendChild(scoreLabel)

        let scoreCount = document.createElement("span")
        scoreCount.setAttribute("id", "scoreCount")

        scoreBoard.appendChild(scoreCount)
        scoreBoard.classList.add("scoreboard")


        let form = document.createElement("form")
        form.setAttribute("action", "#")
        form.addEventListener("submit", event => {
            formSubmit()
            event.preventDefault()
        })

        let labelGuessEntry = document.createElement("label")
        let instructions = document.createElement("div")
        instructions.innerText = "Guess the 5 letter word"
        instructions.classList.add("scoreboard")
        labelGuessEntry.appendChild(instructions)

        let inputText = document.createElement("input")
        inputText.setAttribute("id", "inputText")
        inputText.setAttribute("type", "text")
        inputText.setAttribute("tabindex", "0")
        let inputButton = document.createElement("input")
        inputButton.setAttribute("id", "inputButton")
        inputButton.setAttribute("type", "submit")
        inputButton.setAttribute("value", "Go!")
        inputButton.setAttribute("tabindex", "0")
        labelGuessEntry.appendChild(inputText)
        labelGuessEntry.appendChild(inputButton)

        form.appendChild(labelGuessEntry)
        display.appendChild(form)
        display.appendChild(scoreBoard)


        let lettersArea = document.createElement("div")
        lettersArea.classList.add("alphabet")
        lettersArea.setAttribute("id", "alphabet")

        display.appendChild(lettersArea)

        this.refreshUI()
    }
}

function display(word) {
    console.log(word)
    document.getElementById("display").innerHTML = word
}

let g = new Game()

function addLetter(letter) {
    let box = document.getElementById("inputText")
    box.value = box.value + letter
    box.focus()
}

function start() {
    grab_data().then(function (response) {
        if (response.ok) { return response.json() }
        else {
            throw "Could not load word data."
        }
    }).then(json => {
        g.load(json["words"])
        g.implementUI()
    })
}


function formSubmit() {
    let box = document.getElementById("inputText")
    let input = box.value.toLowerCase()
    console.log("Input from form: " + input)
    let response = g.guess(input)
    if (response) {
        box.value = ""
    }

    return false // don't want the form to html-submit
}

function listenForEnter(event) {
    console.log(event)
}

document.addEventListener("load", start)
start()