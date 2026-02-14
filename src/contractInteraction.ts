import { ethers } from 'ethers';

// To fix the TypeScript error on window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// REPLACE with the address your teammate gives you after deployment
const CONTRACT_ADDRESS = "0xYour_Deployed_Contract_Address_Here";

// This is the ABI you just provided
const CONTRACT_ABI = [
	{
		"inputs": [ { "internalType": "uint8", "name": "_newScore", "type": "uint8" } ],
		"name": "updateVibeScore",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "vibeScore",
		"outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ],
		"stateMutability": "view",
		"type": "function"
	}
];

export const getProviderOrSigner = async (needSigner = false) => {
  if (!window.ethereum) throw new Error("Please install MetaMask");
  const provider = new ethers.BrowserProvider(window.ethereum);
  if (needSigner) return await provider.getSigner();
  return provider;
};

// FUNCTION: Mints the sentiment score to the blockchain
export const tokenizeText = async (score: number) => {
  try {
    const signer = await getProviderOrSigner(true);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // Using updateVibeScore from your ABI
    // Ensure score is an integer (uint8)
    const tx = await contract.updateVibeScore(Math.floor(score));
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Blockchain minting failed:", error);
    throw error;
  }
};