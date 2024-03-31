import { useEffect, useState } from "react";
import { ethers } from "ethers";
// import crypto from 'node:crypto'
// Assuming the ABI is saved in the public directory
import abi from "../abis/Baccarat.json";
import abiMock from "../abis/mock.json"
export default function contract() {
  const [contract, setContract] = useState(null);
  const [mockcontract, setMockContract] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [gameId, setGameId] = useState("");

  const connectWalletHandler = async () => {
    // Check if MetaMask is available
    if (typeof window.ethereum !== "undefined") {
      try {
        // Request account access
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        // Set user address
        setUserAddress(accounts[0]);
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
      }
    } else {
      alert(
        "MetaMask is not installed. Please consider installing it: https://metamask.io/download.html"
      );
    }
  };

  useEffect(() => {
    const loadContract = async () => {
      // Check if MetaMask is available
      if (typeof window.ethereum !== "undefined") {
        // Request account access if needed
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // We use MetaMask's provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Create the contract instance with the signer, which enables sending transactions
        const getBaccaratContract = (signerOrProvider) =>
          new ethers.Contract(
            "0x7fA7D92e2C70D3366688f984DacdA54bF2966617",
            abi,
            signer
          );
        const getMockContract = (signerOrProvider) =>
          new ethers.Contract(
            "0x2047B60f955EE4457a8a65C73B603865B959c179",
            abiMock,
            signer
          );
        setContract(getBaccaratContract);
        setMockContract(getMockContract);
      }
    };

    loadContract();
  }, []);

  // Now you can use the contract instance to interact with your contract
  // Example: calling a contract read function
  useEffect(() => {
    if (contract) {
      const getMinBet = async () => {
        const minBet = await contract.minBet();
        console.log("Minimum Bet:", minBet.toString());
      };

      getMinBet();
    }
  }, [contract]);

  // Function to handle the deal action
  const handleDeal = async () => {
    if (!contract) return;

    try {
      const transaction = await contract.deal(gameId);
      await transaction.wait();
      console.log("Deal successful", transaction);
    } catch (error) {
      console.error("Error dealing:", error);
    }
  };
  //   useEffect(() => {
  //     if (typeof window.ethereum !== 'undefined') {
  //         const provider = new ethers.providers.Web3Provider(window.ethereum);
  //         const signer = provider.getSigner();
  //         const baccaratContract = getBaccaratContract(signer);
  //         setContract(baccaratContract);
  //     }
  // }, []);
  const BetKind = {
    Banker: 0,
    Player: 1,
    Tie: 2,
    // Add other bet kinds as defined in your contract
  };

  const placeBet = async () => {
    if (!contract) return;
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const newGameId = ethers.utils.hexlify(randomBytes);
    const betAmount = "0.01"; // Set the betting amount to 0.01 ETH
    const betKind = BetKind.Banker; // Assuming BetKind.Banker is correctly defined elsewhere

    try {
      // Use newGameId directly here instead of gameId
      const tx = await contract.bet(newGameId, betKind, {
        value: ethers.utils.parseEther(betAmount), // Convert 0.01 ETH to Wei for the transaction
      });
      const receipt = await tx.wait(); // Wait for the transaction to be mined
      console.log("Bet placed successfully", receipt);

      // Update gameId state after the successful transaction
      setGameId(newGameId);
    } catch (error) {
      console.error("Failed to place bet:", error);
    }
};

  const deal = async () => {
    if (!contract || !mockcontract || !gameId) return;

    try {
      // Step 3: Deal
      const dealTx = await contract.deal(gameId).then((tx) => tx.wait(1));
      console.log("Deal transaction:", dealTx);

      // Assuming gameStartedEvent is emitted and contains the requestId
      const gameStartedEvent = dealTx.events?.find(
        (event) => event.event === "GameStarted"
      );
      if (!gameStartedEvent) {
        console.error("GameStarted event not found");
        return;
      }
      const requestId = gameStartedEvent.args[1];
      console.log(`Game started with requestId: ${requestId}`);

      // Step 4: Fulfill randomness - Typically done off-chain or by another contract
      // For testing in a frontend, you might simulate it like this:
      const fulfillTx = await mockcontract.fulfillRandomWords(requestId, [
        69420,
      ]);
      await fulfillTx.wait();
      console.log("Randomness fulfilled");

      // After fulfillment, you might want to refresh or check the game state
      // This would depend on how your contract is set up to handle the callback and update the game state
      const game = await contract.games(gameId);
      console.log(
        `Game state: ${game.state}, Winner: ${game.winner}, Has Pairs: ${game.hasPairs}`
      );
      const results = await contract.getResults(gameId)
      const player = await results.player
      console.log(player)
      player.forEach(card => {

      
        const rank = card.rank !== undefined ? card.rank : card[2];
        const suit = card.suit !== undefined ? card.suit : card[3];
      
        console.log(`Rank: ${rank}, Suit: ${suit}`);
      });


      // Additional checks or state updates in your frontend can go here
    } catch (error) {
      console.error("Failed to deal cards or fulfill randomness:", error);
    }
  };

  const getWinner = async () => {
    try {
      // Ensure requestId is correctly referenced; using a placeholder (2) for demonstration
      // In a real scenario, this should match an actual request ID generated or stored beforehand
      const requestId = 8; // Adjust based on your contract's logic

      // Assuming `fulfillRandomWords` expects (uint256 requestId, uint256[] randomWords)
      // and you're correctly passing a BigNumberish value and array
      const fulfillTx = await mockcontract.fulfillRandomWords(requestId, [
        69420,
      ]);
      await fulfillTx.wait();
      console.log("Randomness fulfilled");

      // Ensure gameId is defined and of correct type
      const game = await contract.games(
        "1234567890"
      ); // gameId needs to be defined and correct
      // Listen for the GameFinalised event
      
          console.log("Player Cards:");
          playerCards.forEach((card) => {
            console.log(`${Rank[card.rank]} of ${Suit[card.suit]}`);
          });

          console.log("Banker Cards:");
          bankerCards.forEach((card) => {
            console.log(`${Rank[card.rank]} of ${Suit[card.suit]}`);
          });
        
      

      console.log(
        `Game state: ${game.state}, Winner: ${game.winner}, Has Pairs: ${game.hasPairs}`
      );
    } catch (error) {
      console.error("Failed to deal cards or fulfill randomness:", error);
    }
  };
  const claimWinnings = async () => {
    if (!contract || !gameId) return;

    const betKind = BetKind.Banker; // Example: claiming winnings for a banker bet
    const userAddress = await contract.signer.getAddress(); // Assumes the signer is set to the user's address

    try {
      const tx = await contract.claimWinnings(userAddress, gameId, betKind);
      await tx.wait();
      console.log("Winnings claimed successfully");
    } catch (error) {
      console.error("Failed to claim winnings:", error);
    }
  };

  return (
    <>
      <div>
        {userAddress ? (
          <p>Connected as: {userAddress}</p>
        ) : (
          <button onClick={connectWalletHandler}>Connect Wallet</button>
        )}
        Check the console for the minimum bet value.
      </div>

      <div>
        {/* <input
          type="text"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          placeholder="Game ID"
        /> */}
        <button onClick={placeBet}>Place Bet</button>
        <button onClick={deal}>Deal</button>
        <button onClick={getWinner}>getwinner</button>
        <button onClick={claimWinnings}>Claim Winnings</button>
      </div>
    </>
  );
}
