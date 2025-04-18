function calculateTotal() {
    // Get the values from the input fields
    const priceInput = document.getElementById("item-price");
    const quantityInput = document.getElementById("quantity");
    const totalPriceDisplay = document.getElementById("total-price");
  
    // Convert the input values to numbers
    const price = parseFloat(priceInput.value);
    const quantity = parseInt(quantityInput.value);
  
    // Check if the inputs are valid numbers
    if (isNaN(price) || isNaN(quantity)) {
      totalPriceDisplay.textContent = "Invalid Input";
      return;
    }
  
    // Calculate the total price
    const total = price * quantity;
}