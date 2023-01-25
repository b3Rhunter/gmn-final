import React from "react";
import { BrowserRouter, Route } from "react-router-dom";
import AllPosts from "./components/AllPosts.js";
import OnePost from "./components/OnePost.js";
import { useState } from "react";
import { ethers } from "ethers";
import ABI from "./ABI.json";
import './constants.js';


function App() {

  
  const [verify, getVerify] = useState(false);
  const [mint, setMint] = useState(false);
  const [name, setName] = useState("");
  const [balance, checkBalance] = useState(true);
  const [burn, setBurn] = useState(false);
  const [connected, isConnected] = useState(true);

  const mintPrompt = async () => {
    setMint(true)
  }

  const handleWalletConnect = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const chainX = await provider.getNetwork();
      console.log(chainX.chainId)
      if (chainX.chainId !== 137) {
        isConnected(false);
        //alert('wrong network')
      } else {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const tokenAddress = "0x12A0FA1A6029FF9b137b80Da429704A1251D5400";
        const tokenContract = new ethers.Contract(tokenAddress, ABI, signer);
        await signer.signMessage("This signature is to verify that you are a GMN subscriber.");
        isConnected(true)
        try{
          const id = await tokenContract.tokenOfOwnerByIndex(address, "0");
          const parsedId = Number(ethers.utils.hexlify(id));
            console.log(parsedId)
          const subCheck = await tokenContract.subCheck(parsedId);
          console.log(subCheck)
          if (subCheck === "Subscribed") {
            getVerify(true)
          }
          if (subCheck !== "Subscribed") {
            setBurn(true)
            console.log('expired')
          }    
        } catch {
            mintPrompt()
            console.log('sub error')
        }
      }

    const { ethereum } = window;
    if(ethereum) {
      const ensProvider = new ethers.providers.InfuraProvider('mainnet');
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const displayAddress = address?.substr(0, 6) + "...";
      const ens = await ensProvider.lookupAddress(address);
      if (ens !== null) {
        setName(ens)

      } else {
        setName(displayAddress)

      }
    } else {
      alert('no wallet detected!')
    }
  }



  return (
    <>
    {!verify && (

        <>
        <div>
        <div className="terminal">
        <div className="container flex-container">
        
      {!mint && (
        <>
            
            <div class="terminal-prompt typeEffect">gmn...</div>
              <button style={{ marginTop: "12px" }} className="btn btn-default btn-ghost" onClick={() => handleWalletConnect()}>
                sign in
              </button>
        </>
      )}

      {mint && (
        <>
              <div class="terminal-prompt typeEffect">mint a subscription...</div> 
              <button style={{ marginTop: "12px" }} className="btn btn-default btn-ghost"
                    onClick={
                      async function mint() {
                        const provider = new ethers.providers.Web3Provider(window.ethereum);
                        await provider.send("eth_requestAccounts", []);
                        const signer = await provider.getSigner();
                        const balance = await signer.getBalance();
                        const parseBalance = await ethers.utils.formatEther(balance);
                        console.log(parseBalance);

                        if (parseBalance < 5) {
                          checkBalance(false);
                          console.log('insuff funds');
                        }

                        try {
                          const provider = new ethers.providers.Web3Provider(window.ethereum);
                          const signer = await provider.getSigner();
                          const contract = new ethers.Contract("0x12A0FA1A6029FF9b137b80Da429704A1251D5400", ABI, signer);

                          const cost = contract.cost();

                          contract.mint({ value: cost });
                          const result = (update) => {
                            console.log("📡 Transaction Update:", update);
                            if (update &&
                              (update.status === "confirmed" ||
                                update.status === 1)) {
                              getVerify(true);
                              console.log(
                                " 🍾 Transaction " + update.hash + " finished!"
                              );
                              console.log(
                                " ⛽️ " +
                                update.gasUsed +
                                "/" +
                                (update.gasLimit || update.gas) +
                                " @ " +
                                parseFloat(update.gasPrice) / 1000000000 +
                                " gwei"
                              );
                            }
                          };
                          console.log(
                            "awaiting metamask/web3 confirm result...",
                            result
                          );
                          console.log(await result);
                        } catch {
                          console.log('mint error');
                        };
                      } }
              >mint</button>      
        </>
      )}

      {burn && (
        <>
              <div class="terminal-prompt typeEffect">subscription expired...</div>
              <button style={{ marginTop: "12px" }} className="btn btn-default btn-ghost"
        onClick={
          async function burn() {
            try {
              const provider = new ethers.providers.Web3Provider(window.ethereum);
              await provider.send("eth_requestAccounts", []);
              const signer = await provider.getSigner();
              const address = await signer.getAddress();
              const contract = new ethers.Contract("0x12A0FA1A6029FF9b137b80Da429704A1251D5400", ABI, signer);
              const id = await contract.tokenOfOwnerByIndex(address, "0");

              contract.burn(id);
              const result = (update) => {
                console.log("📡 Transaction Update:", update);
                if (update &&
                  (update.status === "confirmed" ||
                    update.status === 1)) {
                  setBurn(false);
                  mintPrompt();
                  console.log(
                    " 🍾 Transaction " + update.hash + " finished!"
                  );
                  console.log(
                    " ⛽️ " +
                    update.gasUsed +
                    "/" +
                    (update.gasLimit || update.gas) +
                    " @ " +
                    parseFloat(update.gasPrice) / 1000000000 +
                    " gwei"
                  );
                }
              };
              console.log(
                "awaiting metamask/web3 confirm result...",
                result
              );
              console.log(await result);
            } catch {
              console.log('burn error');
            }
          } }
              >burn</button>
        </>
      )}

      </div>
      </div>
      </div>
      </>
    )}

  {!balance && (
    <div className="terminal" style={{marginTop: "24px"}}>
      <div className="container">
        <h2 className="terminal-prompt typeEffect">insufficient funds...</h2>
      </div>
    </div>
  )}

  {!connected && (
        <div className="terminal" style={{marginTop: "24px"}}>
        <div className="container">
          <h2 className="terminal-prompt typeEffect">wrong network. switch to polygon...</h2>
        </div>
      </div>
  )}

    <BrowserRouter>
        <div>
          {verify && (
            <>
            <div className="terminal">
              <div className="container">
              <h2 style={{marginTop: "24px", marginBottom: "12px"}} className="terminal-prompt typeEffect">welcome back...{name}</h2>
              </div>
              </div>
            <Route target='_blank' component={AllPosts} path="/" exact />
            
            </>
          )}

          <Route component={OnePost} path="/:slug" />
        </div>
      </BrowserRouter></>
  );
}

export default App;
