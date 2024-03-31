import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useState } from "react";
import { ethers, Wallet} from "ethers";
import abi from "../abis/Baccarat.json";
import abiMock from "../abis/mock.json";
import { useEffect } from "react";
export default function Home() {

  const [bankerCards, setBankerCards] = useState([]);
  const [playerCards, setPlayerCards] = useState([]);
  const [selectedChip, setSelectedChip] = useState(null);
  const [playerBet, setPlayerBet] = useState(0);
  const [tieBet, setTieBet] = useState(0);
  const [bankerBet, setBankerBet] = useState(0);
  const [isDealing, setIsDealing] = useState({ banker: false, player: false });
  const [contract, setContract] = useState(null);
  const [mockcontract, setMockContract] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [gameId, setGameId] = useState("");
  const [sessionWallet, setSessionWallet] = useState("")
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
            "0x0841dEF9362c205a5F59A5e232d925fC7A8d8537",
            abi,
            signer
          );
          //sepolia 0x7fA7D92e2C70D3366688f984DacdA54bF2966617
          //astar 0x0841dEF9362c205a5F59A5e232d925fC7A8d8537
        const getMockContract = (signerOrProvider) =>
          new ethers.Contract(
            "0xA93f25b14A2684718a2eF697b070c192C3674b04",
            abiMock,
            signer
          );
          //sepolia 0x2047B60f955EE4457a8a65C73B603865B959c179
          //astar 0xA93f25b14A2684718a2eF697b070c192C3674b04
        setContract(getBaccaratContract);
        setMockContract(getMockContract);
        const SESSION_WALLET_LOCAL_STORAGE_KEY = 'sessionWalletPrivateKey'
        const sessionWalletPrivateKey = localStorage.getItem(SESSION_WALLET_LOCAL_STORAGE_KEY)
        let sessionWallet // import from ethers
        if (localStorage.getItem(SESSION_WALLET_LOCAL_STORAGE_KEY)) {
          // A wallet private key exists in localStorage, load the wallet with it
          const sessionWalletPrivateKey = localStorage.getItem(SESSION_WALLET_LOCAL_STORAGE_KEY);
          sessionWallet = new ethers.Wallet(sessionWalletPrivateKey).connect(provider);
          setSessionWallet(sessionWallet) 
          console.log('Wallet loaded from localStorage:', sessionWallet);
      } else {
          // No wallet exists, create a new one and save its private key in localStorage
          // Note: This is for demo purposes. Be mindful of security implications.
          sessionWallet = ethers.Wallet.createRandom().connect(provider);
          localStorage.setItem(SESSION_WALLET_LOCAL_STORAGE_KEY, sessionWallet.privateKey);
          setSessionWallet(sessionWallet)
          console.log('New wallet created and saved to localStorage:', sessionWallet);
      }
      
      // Example usage: Display wallet address in the console
      console.log('Wallet address:', sessionWallet.address);
     

      }
    };

    loadContract();
  }, []);
  useEffect(() => {
    if (contract) {
      const getMinBet = async () => {
        const minBet = await contract.minBet();
        console.log("Minimum Bet:", minBet.toString());
      };

      getMinBet();
    }
  }, [contract]);
  const BetKind = {
    Banker: 1,
    Player: 0,
    Tie: 2,
    Pairs:3
    // Add other bet kinds as defined in your contract
  };

  const placeBetNew = async () => {
    if (!contract) return;
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });

        // We use MetaMask's provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        console.log(sessionWallet.address)
      const tx = await signer.sendTransaction({
          to: sessionWallet.address, // The recipient address
          value: ethers.utils.parseEther('0.02') // The amount to send in Ether, converted to Wei
      });

      // Wait for the transaction to be mined
      await tx.wait();
      console.log('Transaction successful:', tx);
  } catch (error) {
      console.error('Transaction failed:', error);
  }
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const newGameId = ethers.utils.hexlify(randomBytes);
    const betAmount = bankerBet.toString(); // Set the betting amount to 0.01 ETH
    //const betAmountWei = ethers.utils.parseEther(betAmount.toString()).toString();
    console.log(betAmount);
    const betKind = BetKind.Banker; // Assuming BetKind.Banker is correctly defined elsewhere

    try {
      // Use newGameId directly here instead of gameId
      const tx = await contract.connect(sessionWallet).bet(newGameId, betKind, {
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

  const SUITS = ["Diamonds", "Clubs", "Hearts", "Spades"];
  const RANKS = [
    "Ace",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Jack",
    "Queen",
    "King",
  ];
  const cardToImagePath = (card) => {
    // Directly use the rank and suit strings provided by the card object
    const path = `/cards/${card.rank}_of_${card.suit}.png`;
    console.log(path); // Debugging
    return path;
  };
  

  const dealCards = async () => {
    if (!contract || !mockcontract || !gameId) return;

    try {
      // Step 3: Deal
      const dealTx = await contract.connect(sessionWallet).deal(gameId).then((tx) => tx.wait(1));
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
      const fulfillTx = await mockcontract.connect(sessionWallet).fulfillRandomWords(requestId, [
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
      const results = await contract.getResults(gameId);
      const player = await results.player;
      console.log(player);
      console.log(results.game.winner)
      player.forEach((card) => {
        const rank = card.rank !== undefined ? card.rank : card[2];
        const suit = card.suit !== undefined ? card.suit : card[3];

        console.log(`Rank: ${rank}, Suit: ${suit}`);
      });

      const playerCards = await results.player.map((card) => ({
        rank: RANKS[card.rank],
        suit: SUITS[card.suit],
      }));
      const bankerCards = await results.banker.map((card) => ({
        rank: RANKS[card.rank],
        suit: SUITS[card.suit],
      }));

      // Update state with the fetched cards to render them
      setPlayerCards(playerCards);
      setBankerCards(bankerCards);
      setIsDealing({ banker: true, player: true });
      console.log(playerCards)

      // Additional checks or state updates in your frontend can go here
    } catch (error) {
      console.error("Failed to deal cards or fulfill randomness:", error);
    }
  };

  // A simplified deck with just a few cards for demonstration.
  // You should extend this with the full deck

  // const dealCards = () => {
  //   const newBankerCards = Array.from(
  //     { length: 3 },
  //     () => deck[Math.floor(Math.random() * deck.length)]
  //   );
  //   const newPlayerCards = Array.from(
  //     { length: 3 },
  //     () => deck[Math.floor(Math.random() * deck.length)]
  //   );

  //   setBankerCards(newBankerCards);
  //   setPlayerCards(newPlayerCards);
  //   setIsDealing({ banker: true, player: true });
  // };

  const claimWinnings = async () => {
    if (!contract || !gameId) return;

    const betKind = BetKind.Banker; // Example: claiming winnings for a banker bet
    const userAddress = await contract.signer.getAddress(); // Assumes the signer is set to the user's address

    try {
      const tx = await contract.claimWinnings(userAddress, gameId, betKind, { gasLimit: 2_000_000 });
      await tx.wait();
      console.log("Winnings claimed successfully");
    } catch (error) {
      console.error("Failed to claim winnings:", error);
    }
  };

  const selectChip = (value) => {
    setSelectedChip(Number(value));
  };

  const placeBet = async (area) => {
    if (selectedChip === null) return; // Don't allow betting without selecting a chip

    switch (area) {
      case "PLAYER":
        setPlayerBet(playerBet + selectedChip);
        break;
      case "TIE":
        setTieBet(tieBet + selectedChip);
        break;
      case "BANKER":
        setBankerBet(bankerBet + selectedChip);
        break;
      default:
        // Handle error or invalid bet area
        break;
    }
  };
  const totalWager = playerBet + tieBet + bankerBet;

  const clearSelection = () => {
    // Reset the bets for player, banker, and tie
    setPlayerBet(0);
    setTieBet(0);
    setBankerBet(0);

    // Deselect any currently selected chip, if you have a state for it
    setSelectedChip(null);
  };

  return (
    <>
      {" "}
      {/* <div className="player-cards">
        {playerCards.map((card, index) => (
          <div
            key={index}
            className="card"
            //style={{ position: "relative", width: "100px", height: "140px" }}
          >
            <Image
              src={cardToImagePath(card)}
              alt={`Player Card ${index + 1}`}
              width={100} // Width of the image in pixels
              height={140} // Height of the image in pixels
              objectFit="contain"
              layout="responsive"
            />
          </div>
        ))}
      </div> */}
      <div className="game-container">
        <div className="header">
          {userAddress ? (
            <p>Connected as: {userAddress}</p>
          ) : (
            <button onClick={connectWalletHandler}>Connect Wallet</button>
          )}
          <h1>BACCARAT</h1>
          <h2>TIE PAYS 8 TO 1</h2>
        </div>
        <div className="card-sections">
          {/* Player Cards Container */}
          <div className="cards-landing-area player-cards-container">
            <div className="player-cards">
              {playerCards.length > 0 ? (
                playerCards.map((card, index) => (
                  <div
                    key={index}
                    className={`card ${
                      isDealing.player ? `fly-in-player-${index + 1}` : ""
                    }`}
                  >
                    <Image
                      src={cardToImagePath(card)}
                      alt={`Player Card ${index + 1}`}
                      width={100}
                      height={140}
                      objectFit="contain"
                      layout="responsive"
                    />
                  </div>
                ))
              ) : (
                <p>Loading player cards...</p>
              )}
            </div>
          </div>

          {/* Banker Cards Container, mirrored */}
          <div className="cards-landing-area banker-cards-container">
            <div className="banker-cards">
              {bankerCards.length > 0 ? (
                bankerCards.map((card, index) => (
                  <div
                    key={index}
                    className={`card ${
                      isDealing.banker ? `fly-in-banker-${index + 1}` : ""
                    }`}
                  >
                    <Image
                      src={cardToImagePath(card)}
                      alt={`Banker Card ${index + 1}`}
                      width={100}
                      height={140}
                      objectFit="contain"
                      layout="responsive"
                    />
                  </div>
                ))
              ) : (
                <p>Loading banker cards...</p>
              )}
            </div>
          </div>
        </div>

        <div className="betting-section">
          <button
            className={`bet-button ${playerBet ? "active" : ""}`}
            onClick={() => placeBet("PLAYER")}
          >
            PLAYER
            {playerBet > 0 && (
              <span className="chip-indicator">ETH {playerBet}</span>
            )}
          </button>
          <button
            className={`bet-button ${tieBet ? "active" : ""}`}
            onClick={() => placeBet("TIE")}
          >
            TIE
            {tieBet > 0 && <span className="chip-indicator">ETH {tieBet}</span>}
          </button>
          <button
            className={`bet-button ${bankerBet ? "active" : ""}`}
            onClick={() => placeBet("BANKER")}
          >
            BANKER
            {bankerBet > 0 && (
              <span className="chip-indicator">ETH {bankerBet}</span>
            )}
          </button>
        </div>


        <div className="container">
          <div className="total-wager-display">Wager: ETH {totalWager}</div>

          <div className="chip-section">
            {["0.01", "0.1", "1", "10"].map((chipValue) => (
              <button
                key={chipValue}
                className={`chip ${
                  selectedChip === Number(chipValue) ? "selected" : ""
                }`}
                onClick={() => selectChip(chipValue)}
              >
                ETH {chipValue}
              </button>
            ))}
          </div>
          <button onClick={placeBetNew} className="deal-button">
            Place Bet
          </button>
          <button onClick={dealCards} className="deal-button">
            Deal
          </button>
          <button onClick={claimWinnings} className="deal-button">
            claim winning
          </button>
          <button
            onClick={clearSelection}
            className="action-button clear-button"
          >
            Clear
          </button>
        </div>
      </div>{" "}
    </>
  );
}
