"use strict";

const expressionElement =
  document.getElementById("expression");

const resultElement =
  document.getElementById("result");

const keypad =
  document.querySelector(".keypad");

const historyToggle =
  document.getElementById("historyToggle");

const historyPanel =
  document.getElementById("historyPanel");

const clearHistoryButton =
  document.getElementById("clearHistory");

const historyList =
  document.getElementById("historyList");


let currentInput = "0";

let expression = "";

let firstOperand = null;

let operator = null;

let waitingForOperand = false;

let justCalculated = false;


/* -----------------------------
   DISPLAY
----------------------------- */

function updateDisplay() {

  resultElement.textContent =
    formatNumber(currentInput);

  expressionElement.textContent =
    expression;

}


/* -----------------------------
   NUMBER FORMAT
----------------------------- */

function formatNumber(value) {

  if (value === "Error") {
    return value;
  }


  const number = Number(value);


  if (!Number.isFinite(number)) {
    return "Error";
  }


  if (
    Math.abs(number) >= 1e12 ||
    (
      Math.abs(number) > 0 &&
      Math.abs(number) < 1e-9
    )
  ) {

    return number.toExponential(6);

  }


  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 10
    }
  ).format(number);

}


/* -----------------------------
   INPUT NUMBER
----------------------------- */

function inputNumber(number) {

  if (currentInput === "Error") {
    clearCalculator();
  }


  if (
    waitingForOperand ||
    justCalculated
  ) {

    currentInput = number;

    waitingForOperand = false;

    justCalculated = false;

  } else {

    if (
      currentInput === "0"
    ) {

      currentInput = number;

    } else {

      currentInput += number;

    }

  }


  updateDisplay();

}


/* -----------------------------
   DECIMAL
----------------------------- */

function inputDecimal() {

  if (
    waitingForOperand ||
    justCalculated
  ) {

    currentInput = "0.";

    waitingForOperand = false;

    justCalculated = false;

  } else if (
    !currentInput.includes(".")
  ) {

    currentInput += ".";

  }


  updateDisplay();

}


/* -----------------------------
   OPERATOR
----------------------------- */

function inputOperator(nextOperator) {

  if (currentInput === "Error") {
    return;
  }


  const inputValue =
    Number(currentInput);


  if (
    operator &&
    waitingForOperand
  ) {

    operator = nextOperator;

    expression =
      `${formatNumber(firstOperand)} ${operatorSymbol(nextOperator)}`;

    updateDisplay();

    return;

  }


  if (firstOperand === null) {

    firstOperand = inputValue;

  } else if (operator) {

    const result =
      calculate(
        firstOperand,
        inputValue,
        operator
      );


    if (result === null) {

      showError();

      return;

    }


    firstOperand = result;

    currentInput =
      String(result);

  }


  operator = nextOperator;

  waitingForOperand = true;

  justCalculated = false;


  expression =
    `${formatNumber(firstOperand)} ${operatorSymbol(operator)}`;


  updateDisplay();

}


/* -----------------------------
   CALCULATE
----------------------------- */

function calculate(
  first,
  second,
  selectedOperator
) {

  switch (selectedOperator) {

    case "+":
      return first + second;

    case "-":
      return first - second;

    case "*":
      return first * second;

    case "/":

      if (second === 0) {
        return null;
      }

      return first / second;

    default:
      return second;

  }

}


/* -----------------------------
   EQUALS
----------------------------- */

function performCalculation() {

  if (
    operator === null ||
    firstOperand === null ||
    waitingForOperand
  ) {
    return;
  }


  const secondOperand =
    Number(currentInput);


  const selectedOperator =
    operator;


  const result =
    calculate(
      firstOperand,
      secondOperand,
      selectedOperator
    );


  if (result === null) {

    const failedExpression =
      `${formatNumber(firstOperand)} ${operatorSymbol(selectedOperator)} ${formatNumber(secondOperand)}`;

    saveHistory(
      failedExpression,
      "Error"
    );

    showError();

    return;

  }


  const fullExpression =
    `${formatNumber(firstOperand)} ${operatorSymbol(selectedOperator)} ${formatNumber(secondOperand)}`;


  saveHistory(
    fullExpression,
    String(result)
  );


  expression =
    `${fullExpression} =`;


  currentInput =
    String(result);


  firstOperand = null;

  operator = null;

  waitingForOperand = false;

  justCalculated = true;


  updateDisplay();

}


/* -----------------------------
   CLEAR
----------------------------- */

function clearCalculator() {

  currentInput = "0";

  expression = "";

  firstOperand = null;

  operator = null;

  waitingForOperand = false;

  justCalculated = false;


  updateDisplay();

}


/* -----------------------------
   DELETE
----------------------------- */

function deleteLast() {

  if (
    waitingForOperand ||
    justCalculated
  ) {
    return;
  }


  if (
    currentInput.length <= 1
  ) {

    currentInput = "0";

  } else {

    currentInput =
      currentInput.slice(0, -1);

  }


  updateDisplay();

}


/* -----------------------------
   PERCENT
----------------------------- */

function convertToPercent() {

  if (
    currentInput === "Error"
  ) {
    return;
  }


  const value =
    Number(currentInput);


  currentInput =
    String(value / 100);


  updateDisplay();

}


/* -----------------------------
   SIGN
----------------------------- */

function toggleSign() {

  if (
    currentInput === "0" ||
    currentInput === "Error"
  ) {
    return;
  }


  if (
    currentInput.startsWith("-")
  ) {

    currentInput =
      currentInput.substring(1);

  } else {

    currentInput =
      "-" + currentInput;

  }


  updateDisplay();

}


/* -----------------------------
   ERROR
----------------------------- */

function showError() {

  currentInput = "Error";

  expression = "Cannot divide by zero";

  firstOperand = null;

  operator = null;

  waitingForOperand = false;

  justCalculated = true;


  updateDisplay();

}


/* -----------------------------
   OPERATOR SYMBOL
----------------------------- */

function operatorSymbol(value) {

  const symbols = {
    "+": "+",
    "-": "−",
    "*": "×",
    "/": "÷"
  };


  return symbols[value] || value;

}


/* -----------------------------
   HISTORY
----------------------------- */

function getHistory() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "calculatorHistory"
      )
    ) || [];

  } catch {

    return [];

  }

}


function saveHistory(
  calculation,
  result
) {

  const history =
    getHistory();


  history.unshift({
    calculation,
    result
  });


  const limitedHistory =
    history.slice(0, 30);


  localStorage.setItem(
    "calculatorHistory",
    JSON.stringify(limitedHistory)
  );


  renderHistory();

}


function renderHistory() {

  const history =
    getHistory();


  historyList.innerHTML = "";


  if (history.length === 0) {

    const empty =
      document.createElement("p");

    empty.className =
      "empty-history";

    empty.textContent =
      "No calculations yet.";

    historyList.appendChild(empty);

    return;

  }


  history.forEach(
    (item) => {

      const historyItem =
        document.createElement("div");

      historyItem.className =
        "history-item";


      const calculation =
        document.createElement("div");

      calculation.className =
        "history-expression";

      calculation.textContent =
        item.calculation;


      const result =
        document.createElement("div");

      result.className =
        "history-result";

      result.textContent =
        formatNumber(item.result);


      historyItem.appendChild(
        calculation
      );

      historyItem.appendChild(
        result
      );


      historyItem.addEventListener(
        "click",
        () => {

          currentInput =
            item.result;

          expression =
            item.calculation;

          firstOperand = null;

          operator = null;

          waitingForOperand = false;

          justCalculated = true;

          updateDisplay();

          closeHistory();

        }
      );


      historyList.appendChild(
        historyItem
      );

    }
  );

}


/* -----------------------------
   CLEAR HISTORY
----------------------------- */

function clearHistory() {

  localStorage.removeItem(
    "calculatorHistory"
  );

  renderHistory();

}


/* -----------------------------
   HISTORY PANEL
----------------------------- */

function openHistory() {

  historyPanel.classList.add(
    "open"
  );

  historyPanel.setAttribute(
    "aria-hidden",
    "false"
  );

}


function closeHistory() {

  historyPanel.classList.remove(
    "open"
  );

  historyPanel.setAttribute(
    "aria-hidden",
    "true"
  );

}
const closeHistoryButton =
  document.getElementById("closeHistory");
  closeHistoryButton.addEventListener(
  "click",
  closeHistory
);


/* -----------------------------
   BUTTON EVENTS
----------------------------- */

keypad.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        "button"
      );


    if (!button) {
      return;
    }


    const value =
      button.dataset.value;

    const action =
      button.dataset.action;


    if (
      button.classList.contains(
        "number"
      )
    ) {

      if (action === "decimal") {

        inputDecimal();

      } else {

        inputNumber(value);

      }

      return;

    }


    if (
      button.classList.contains(
        "operator"
      )
    ) {

      inputOperator(value);

      return;

    }


    switch (action) {

      case "clear":

        clearCalculator();

        break;


      case "delete":

        deleteLast();

        break;


      case "percent":

        convertToPercent();

        break;


      case "sign":

        toggleSign();

        break;


      case "calculate":

        performCalculation();

        break;

    }

  }
);


/* -----------------------------
   HISTORY EVENTS
----------------------------- */

historyToggle.addEventListener(
  "click",
  () => {

    const isOpen =
      historyPanel.classList.contains(
        "open"
      );


    if (isOpen) {

      closeHistory();

    } else {

      renderHistory();

      openHistory();

    }

  }
);


clearHistoryButton.addEventListener(
  "click",
  clearHistory
);


/* -----------------------------
   KEYBOARD SUPPORT
----------------------------- */

document.addEventListener(
  "keydown",
  (event) => {

    const key =
      event.key;


    if (
      key >= "0" &&
      key <= "9"
    ) {

      inputNumber(key);

      return;

    }


    if (key === ".") {

      inputDecimal();

      return;

    }


    if (
      key === "+" ||
      key === "-" ||
      key === "*" ||
      key === "/"
    ) {

      inputOperator(key);

      return;

    }


    if (
      key === "Enter" ||
      key === "="
    ) {

      event.preventDefault();

      performCalculation();

      return;

    }


    if (key === "Backspace") {

      deleteLast();

      return;

    }


    if (key === "Escape") {

      clearCalculator();

      return;

    }


    if (key === "%") {

      convertToPercent();

      return;

    }

  }
);


/* -----------------------------
   INITIALIZE
----------------------------- */

updateDisplay();

renderHistory();