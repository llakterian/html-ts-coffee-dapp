// DOM Elements
const connectButton = document.getElementById('connectButton') as HTMLButtonElement | null;
const fundButton = document.getElementById('fundButton') as HTMLButtonElement | null;
const ethAmountInput = document.getElementById('ethAmount') as HTMLInputElement | null;
const balanceButton = document.getElementById('balanceButton') as HTMLButtonElement | null;
const withdrawButton = document.getElementById('withdrawButton') as HTMLButtonElement | null;
const statusElement = document.getElementById('status') as HTMLDivElement | null;

// Contract constants - these are declared in constants-js.js
declare const contractAddress: string;
declare const coffeeAbi: any[];
declare const HARDCODED_OWNER: string;

/**
 * Display status messages to the user
 * @param message - The message to display
 */
function updateStatus(message: string): void {
    if (statusElement) {
        statusElement.textContent = message;
    }
    console.log(message);
}

/**
 * Connect to MetaMask wallet
 */
async function connect(): Promise<void> {
    if (!connectButton || !withdrawButton) return;
    
    if (typeof (window as any).ethereum === 'undefined') {
        connectButton.innerHTML = "Please install MetaMask!";
        updateStatus("MetaMask not installed!");
        return;
    }
    
    try {
        connectButton.innerHTML = "Connecting...";
        connectButton.disabled = true;
        updateStatus("Connecting to wallet...");
        
        // Request accounts
        const accounts: string[] = await (window as any).ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (accounts.length === 0) {
            throw new Error("No accounts returned from MetaMask");
        }
        
        const currentAccount: string = accounts[0];
        connectButton.innerHTML = "Connected!";
        updateStatus(`Connected with account: ${currentAccount}`);
        
        // Check if current account is the owner
        const isOwner = currentAccount.toLowerCase() === HARDCODED_OWNER.toLowerCase();
        withdrawButton.disabled = !isOwner;
        
        if (isOwner) {
            updateStatus("You are the owner. Withdraw button enabled.");
        } else {
            updateStatus("You are not the owner. Withdraw button disabled.");
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Connection failed:", error);
        connectButton.innerHTML = "Connection Failed";
        updateStatus(`Connection failed: ${errorMessage}`);
    } finally {
        connectButton.disabled = false;
    }
}

/**
 * Fund the contract (Buy Coffee)
 */
async function fund(): Promise<void> {
    if (!ethAmountInput || !fundButton) return;
    
    const ethAmount: string = ethAmountInput.value;
    const ethAmountNum = Number(ethAmount);
    
    if (!ethAmount || isNaN(ethAmountNum) || ethAmountNum <= 0) {
        updateStatus("Please enter a valid ETH amount");
        return;
    }
    
    if (typeof (window as any).ethereum === 'undefined') {
        updateStatus("Please install MetaMask!");
        return;
    }
    
    updateStatus(`Funding with ${ethAmount} ETH...`);
    
    try {
        fundButton.innerHTML = "Processing...";
        fundButton.disabled = true;
        
        // Get connected account
        const accounts: string[] = await (window as any).ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (accounts.length === 0) {
            throw new Error("No accounts returned from MetaMask");
        }
        
        const from: string = accounts[0];
        
        // Convert ETH to Wei
        const weiAmount: number = ethAmountNum * 1e18;
        const hexWeiAmount: string = '0x' + Math.floor(weiAmount).toString(16);
        
        // Create transaction
        const transactionParameters = {
            to: contractAddress,
            from: from,
            value: hexWeiAmount,
            data: '0xb60d4288', // function signature for fund()
        };
        
        // Send transaction
        const txHash: string = await (window as any).ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });
        
        updateStatus(`Transaction submitted! Hash: ${txHash}`);
        
        // Wait a bit and then get the balance
        setTimeout(getBalance, 2000);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Funding failed:", error);
        updateStatus(`Funding failed: ${errorMessage}`);
    } finally {
        fundButton.innerHTML = "Buy Coffee";
        fundButton.disabled = false;
    }
}

/**
 * Get contract balance
 */
async function getBalance(): Promise<void> {
    if (!balanceButton) return;
    
    if (typeof (window as any).ethereum === 'undefined') {
        updateStatus("Please install MetaMask!");
        return;
    }
    
    try {
        balanceButton.innerHTML = "Loading...";
        balanceButton.disabled = true;
        
        // Get balance
        const balance: string = await (window as any).ethereum.request({
            method: 'eth_getBalance',
            params: [contractAddress, 'latest'],
        });
        
        // Convert from hex wei to ETH
        const balanceInWei: number = parseInt(balance, 16);
        const balanceInEth: number = balanceInWei / 1e18;
        
        updateStatus(`Contract balance: ${balanceInEth.toFixed(6)} ETH`);
        alert(`Current contract balance: ${balanceInEth.toFixed(6)} ETH`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Failed to get balance:", error);
        updateStatus(`Failed to get balance: ${errorMessage}`);
    } finally {
        balanceButton.innerHTML = "Get Balance";
        balanceButton.disabled = false;
    }
}

/**
 * Withdraw funds (only owner)
 */
async function withdraw(): Promise<void> {
    if (!withdrawButton) return;
    
    if (typeof (window as any).ethereum === 'undefined') {
        updateStatus("Please install MetaMask!");
        return;
    }
    
    updateStatus("Attempting to withdraw funds...");
    
    try {
        withdrawButton.innerHTML = "Processing...";
        withdrawButton.disabled = true;
        
        // Get connected account
        const accounts: string[] = await (window as any).ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (accounts.length === 0) {
            throw new Error("No accounts returned from MetaMask");
        }
        
        const from: string = accounts[0];
        
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
        const txHash: string = await (window as any).ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });
        
        updateStatus(`Withdrawal transaction submitted! Hash: ${txHash}`);
        
        // Wait a bit and then get the balance
        setTimeout(getBalance, 2000);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Withdrawal failed:", error);
        updateStatus(`Withdrawal failed: ${errorMessage}`);
    } finally {
        withdrawButton.innerHTML = "Withdraw";
        withdrawButton.disabled = false;
    }
}

/**
 * Initialize the page
 */
function initialize(): void {
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
    if (typeof (window as any).ethereum !== 'undefined' && (window as any).ethereum.selectedAddress) {
        connect();
    }
    
    updateStatus("Ready to connect. Please click 'Connect' to start.");
}

// Initialize when the page loads
window.addEventListener('DOMContentLoaded', initialize);
