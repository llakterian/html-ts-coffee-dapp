var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// DOM Elements
const connectButton = document.getElementById('connectButton');
const fundButton = document.getElementById('fundButton');
const ethAmountInput = document.getElementById('ethAmount');
const balanceButton = document.getElementById('balanceButton');
const withdrawButton = document.getElementById('withdrawButton');
const statusElement = document.getElementById('status');
/**
 * Display status messages to the user
 * @param message - The message to display
 */
function updateStatus(message) {
    if (statusElement) {
        statusElement.textContent = message;
    }
    console.log(message);
}
/**
 * Connect to MetaMask wallet
 */
function connect() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!connectButton || !withdrawButton)
            return;
        if (typeof window.ethereum === 'undefined') {
            connectButton.innerHTML = "Please install MetaMask!";
            updateStatus("MetaMask not installed!");
            return;
        }
        try {
            connectButton.innerHTML = "Connecting...";
            connectButton.disabled = true;
            updateStatus("Connecting to wallet...");
            // Request accounts
            const accounts = yield window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            if (accounts.length === 0) {
                throw new Error("No accounts returned from MetaMask");
            }
            const currentAccount = accounts[0];
            connectButton.innerHTML = "Connected!";
            updateStatus(`Connected with account: ${currentAccount}`);
            // Check if current account is the owner
            const isOwner = currentAccount.toLowerCase() === HARDCODED_OWNER.toLowerCase();
            withdrawButton.disabled = !isOwner;
            if (isOwner) {
                updateStatus("You are the owner. Withdraw button enabled.");
            }
            else {
                updateStatus("You are not the owner. Withdraw button disabled.");
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error("Connection failed:", error);
            connectButton.innerHTML = "Connection Failed";
            updateStatus(`Connection failed: ${errorMessage}`);
        }
        finally {
            connectButton.disabled = false;
        }
    });
}
/**
 * Fund the contract (Buy Coffee)
 */
function fund() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!ethAmountInput || !fundButton)
            return;
        const ethAmount = ethAmountInput.value;
        const ethAmountNum = Number(ethAmount);
        if (!ethAmount || isNaN(ethAmountNum) || ethAmountNum <= 0) {
            updateStatus("Please enter a valid ETH amount");
            return;
        }
        if (typeof window.ethereum === 'undefined') {
            updateStatus("Please install MetaMask!");
            return;
        }
        updateStatus(`Funding with ${ethAmount} ETH...`);
        try {
            fundButton.innerHTML = "Processing...";
            fundButton.disabled = true;
            // Get connected account
            const accounts = yield window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            if (accounts.length === 0) {
                throw new Error("No accounts returned from MetaMask");
            }
            const from = accounts[0];
            // Convert ETH to Wei
            const weiAmount = ethAmountNum * 1e18;
            const hexWeiAmount = '0x' + Math.floor(weiAmount).toString(16);
            // Create transaction
            const transactionParameters = {
                to: contractAddress,
                from: from,
                value: hexWeiAmount,
                data: '0xb60d4288', // function signature for fund()
            };
            // Send transaction
            const txHash = yield window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters],
            });
            updateStatus(`Transaction submitted! Hash: ${txHash}`);
            // Wait a bit and then get the balance
            setTimeout(getBalance, 2000);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error("Funding failed:", error);
            updateStatus(`Funding failed: ${errorMessage}`);
        }
        finally {
            fundButton.innerHTML = "Buy Coffee";
            fundButton.disabled = false;
        }
    });
}
/**
 * Get contract balance
 */
function getBalance() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!balanceButton)
            return;
        if (typeof window.ethereum === 'undefined') {
            updateStatus("Please install MetaMask!");
            return;
        }
        try {
            balanceButton.innerHTML = "Loading...";
            balanceButton.disabled = true;
            // Get balance
            const balance = yield window.ethereum.request({
                method: 'eth_getBalance',
                params: [contractAddress, 'latest'],
            });
            // Convert from hex wei to ETH
            const balanceInWei = parseInt(balance, 16);
            const balanceInEth = balanceInWei / 1e18;
            updateStatus(`Contract balance: ${balanceInEth.toFixed(6)} ETH`);
            alert(`Current contract balance: ${balanceInEth.toFixed(6)} ETH`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error("Failed to get balance:", error);
            updateStatus(`Failed to get balance: ${errorMessage}`);
        }
        finally {
            balanceButton.innerHTML = "Get Balance";
            balanceButton.disabled = false;
        }
    });
}
/**
 * Withdraw funds (only owner)
 */
function withdraw() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!withdrawButton)
            return;
        if (typeof window.ethereum === 'undefined') {
            updateStatus("Please install MetaMask!");
            return;
        }
        updateStatus("Attempting to withdraw funds...");
        try {
            withdrawButton.innerHTML = "Processing...";
            withdrawButton.disabled = true;
            // Get connected account
            const accounts = yield window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            if (accounts.length === 0) {
                throw new Error("No accounts returned from MetaMask");
            }
            const from = accounts[0];
            // Check if user is owner
            if (from.toLowerCase() !== HARDCODED_OWNER.toLowerCase()) {
                updateStatus("Only the contract owner can withdraw funds!");
                return;
            }
            // Create transaction
            const transactionParameters = {
                to: contractAddress,
                from: from,
                data: '0x3ccfd60b', // function signature for cheaperWithdraw()
            };
            // Send transaction
            const txHash = yield window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters],
            });
            updateStatus(`Withdrawal transaction submitted! Hash: ${txHash}`);
            // Wait a bit and then get the balance
            setTimeout(getBalance, 2000);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error("Withdrawal failed:", error);
            updateStatus(`Withdrawal failed: ${errorMessage}`);
        }
        finally {
            withdrawButton.innerHTML = "Withdraw";
            withdrawButton.disabled = false;
        }
    });
}
/**
 * Initialize the page
 */
function initialize() {
    if (!connectButton || !fundButton || !balanceButton || !withdrawButton) {
        console.error("Required DOM elements not found");
        return;
    }
    // Disable withdraw button by default
    withdrawButton.disabled = true;
    // Set up event listeners
    connectButton.addEventListener('click', connect);
    fundButton.addEventListener('click', fund);
    balanceButton.addEventListener('click', getBalance);
    withdrawButton.addEventListener('click', withdraw);
    // Check if MetaMask is already connected
    if (typeof window.ethereum !== 'undefined' && window.ethereum.selectedAddress) {
        connect();
    }
    updateStatus("Ready to connect. Please click 'Connect' to start.");
}
// Initialize when the page loads
window.addEventListener('DOMContentLoaded', initialize);
