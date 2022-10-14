import { Button, Col, Menu, Row, notification } from "antd";
import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "react-router-dom";
import "./App.css";
import { Account, Contract, Header, NetworkDisplay, FaucetHint, NetworkSwitch } from "./components";
import { NETWORKS, INFURA_ID } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import { Transactor, Web3ModalSetup } from "./helpers";
import { Home, ExampleUI, Hints, Subgraph } from "./views";
import { useStaticJsonRPC } from "./hooks";

import sanityClient from "./client.js";
import Logo from "./images/bp_logo_512.png";
import "./myCss.css";
import OnePost from "./OnePost";
import AllPosts from "./AllPosts";
import gmnabi from "./gmnabi.json";
import imageUrlBuilder from "@sanity/image-url";

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Alchemy.com & Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const initialNetwork = NETWORKS.polygon; // <------- select your target frontend network (localhost, goerli, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = false;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = false; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = false;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://mainnet.infura.io/v3/${INFURA_ID}`,
  "https://rpc.scaffoldeth.io:48544",
];

function App(props) {
  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  const networkOptions = [initialNetwork.name, "mainnet", "goerli"];

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const location = useLocation();

  const targetNetwork = NETWORKS[selectedNetwork];

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider, USE_BURNER_WALLET);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // const contractConfig = useContractConfig();

  const contractConfig = { externalContracts: externalContracts };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  // keep track of a variable from the contract in the local React state:
  const purpose = useContractReader(readContracts, "YourContract", "purpose");

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
    localChainId,
    myMainnetDAIBalance,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [change, setChange] = useState(true);
  const [allPostsData, setAllPosts] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [single, setSingle] = useState(true);
  const [isSigning, setIsSigning] = useState(false);

  function changeContent() {
    setSingle(!single);
  }

  function changeButton() {
    setChange(!change);
  }

  const builder = imageUrlBuilder(sanityClient);
  function urlFor(source) {
    return builder.image(source);
  }

  const sendNotification = (type, data) => {
    return notification[type]({
      ...data,
      placement: "bottomRight",
    });
  };

  useEffect(() => {
    sanityClient
      .fetch(
        `*[_type == "post"] | order(publishedAt desc){
            slug,
            publishedAt,
            "name": author->name,
            "authorImage": author->image,
            mainImage{
              asset->{
                _id,
                url
              }
            }
          }`,
      )
      .then(data => setAllPosts(data))
      .catch(console.error);
  }, []);

  console.log(allPostsData);

 

  // Sign In With Ethereum

  const handleSignIn = async () => {
    if (web3Modal.cachedProvider === "") {
      return sendNotification("error", {
        message: "Failed to Sign In!",
        description: "Please Connect a wallet before Signing in",
      });
    }

    setIsSigning(true);

    try {
      // sign message using wallet
      const message = `GMN Verify`;
      const address = await userSigner.getAddress();
      let signature = await userSigner.signMessage(message);

      const isValid = await validateUser(message, address, signature);

      if (!isValid) {
        throw new Error("You are not a GMN holder.");
      }

      setIsAuth(isValid);

      // notify user of sign-in
      sendNotification("success", {
        message: "Verified GMN Holder",
      });
    } catch (error) {
      sendNotification("error", {
        message: "Verification Failed!",
        description: `Connection issue - ${error.message}`,
      });
    }

    setIsSigning(false);
  };


   // Token Gate 🚫
   const validateUser = async (message, address, signature) => {
    // validate signature
    const recovered = ethers.utils.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return false;
    }

    try {
      // validate token balance
      const tokenAddress = "0xfD18418c4AEf8edcAfF3EFea4A4bE2cC1cF2E580";

      const tokenContract = new ethers.Contract(tokenAddress, gmnabi, userSigner);

      const balance = await tokenContract.balanceOf(address);

      return balance.gt(0);
    } catch (error) {
      console.log(error);

      return false;
    }
  };

  return (
    <div className="App background">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header>
        {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flex: 1 }}>
            {USE_NETWORK_SELECTOR && (
              <div style={{ marginRight: 20 }}>
                <NetworkSwitch
                  networkOptions={networkOptions}
                  selectedNetwork={selectedNetwork}
                  setSelectedNetwork={setSelectedNetwork}
                />
              </div>
            )}
            <Account
              useBurner={USE_BURNER_WALLET}
              address={address}
              localProvider={localProvider}
              userSigner={userSigner}
              mainnetProvider={mainnetProvider}
              price={price}
              web3Modal={web3Modal}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              blockExplorer={blockExplorer}
            />
          </div>
        </div>
      </Header>

      <button   className="mint"
                onClick={async () => {
                  /* look how you call setPurpose on your contract: */
                  /* notice how you pass a call back for tx updates too */
                const contract = new ethers.Contract("0xfD18418c4AEf8edcAfF3EFea4A4bE2cC1cF2E580", gmnabi, userSigner);

                  const cost = contract.cost(); 
                  const result = tx(contract.mint(1, {value: cost}), update => {
                    console.log("📡 Transaction Update:", update);
                    if (update && (update.status === "confirmed" || update.status === 1)) {
                      
                      sendNotification("success", {
                        message: "Minted",
                        description: `You can now view any article of your choice.`,
                      });
                      console.log(" 🍾 Transaction " + update.hash + " finished!");
                      console.log(
                        " ⛽️ " +
                          update.gasUsed +
                          "/" +
                          (update.gasLimit || update.gas) +
                          " @ " +
                          parseFloat(update.gasPrice) / 1000000000 +
                          " gwei",
                      );
                    }
                  });
                  console.log("awaiting metamask/web3 confirm result...", result);
                  console.log(await result);
                }}
        style={{
          position: "fixed",
          bottom: "10px",
          left: "10px",
          display: "block",
          width: "auto",
          cursor: "pointer",
          zIndex: "10",
        }}
        type="default"
      >
        Mint
      </button>

      <a href="https://gmn-german-final.vercel.app/" target="_blank" rel="noreferrer"
      style={{textDecoration: "none", color: "#fff"}}> 
      <button className="mint"
              style={{
                position: "fixed",
                bottom: "10px",
                left: "100px",
                display: "block",
                width: "auto",
                cursor: "pointer",
                zIndex: "10",
              }}
              type="default"
      >German Edition</button></a> 

      <div className="min-h-screen p-12">
        <div className="container mx-auto">
          <img className="flex logo" style={{ paddingTop: "100px" }} src={Logo} alt="logo"></img>

          <button className="verify"
                  style={{
                    marginBottom: "12px",
                    display: "block",
                    marginLeft: "auto",
                    marginRight: "auto",
                    width: "15%",
                    minWidth: "175px"
                   }} 
                   onClick={handleSignIn} loading={isSigning}>Verify</button>

          <input
            style={{
              marginBottom: "10px",
              border: "1px solid #fff",
              borderRadius: "5px",
              paddingLeft: "5px",
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
            placeholder="search..."
          ></input>
        </div>
      </div>

      {single ? (
        <div className="min-h-screen p-12">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allPostsData &&
                allPostsData.map((post, index) => (
                  <span
                    className="block h-64 relative rounded shadow leading-snug bg-black border-l-8 "
                    style={{ borderColor: "#313131" }}
                    key={index}
                  >
                    <img
                      className="w-full h-full rounded-r object-cover absolute"
                      src={post.mainImage.asset.url}
                      alt=""
                    />
                    <span className="block relative h-full flex justify-start items-start pr-4 pb-4">
                  

                  
                      <h6
                        className=" font-bold px-3 py-3 text-red-100 flag"
                        style={{ position: "absolute", right: "0", bottom: "0" }}
                      >
                        <span>                     
                          <img
                            src={urlFor(post.authorImage).url()}
                            className="w-5 h-5 rounded-full"
                            alt="Author: Pub" style={{float: "left", marginRight: "3px"}}
                        /></span>
                        <span> {post.name}</span>
                      </h6>

                      <span>
                        {isAuth && (
                          <Link to={"/" + post.slug.current} key={post.slug.current}>
                            <button
                              onClick={changeContent}
                              className="view-btn"
                              style={{ position: "absolute", left: "10px", bottom: "10px" }}
                            >
                              view
                            </button>
                          </Link>
                        )}
                      </span>
                    </span>
                  </span>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <Route component={OnePost} path="/:slug" />
      )}

      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        USE_NETWORK_SELECTOR={USE_NETWORK_SELECTOR}
      />

      <Switch>
        <Route exact path="/">
          {/* pass in any web3 props to this Home component. For example, yourLocalBalance */}
          <Home yourLocalBalance={yourLocalBalance} readContracts={readContracts} />
        </Route>
        <Route exact path="/debug">
          {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}

          <Contract
            name="YourContract"
            price={price}
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
        </Route>
        <Route path="/hints">
          <Hints
            address={address}
            yourLocalBalance={yourLocalBalance}
            mainnetProvider={mainnetProvider}
            price={price}
          />
        </Route>
        <Route path="/exampleui">
          <ExampleUI
            address={address}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            localProvider={localProvider}
            yourLocalBalance={yourLocalBalance}
            price={price}
            tx={tx}
            writeContracts={writeContracts}
            readContracts={readContracts}
            purpose={purpose}
          />
        </Route>
        <Route path="/mainnetdai">
          <Contract
            name="DAI"
            customContract={mainnetContracts && mainnetContracts.contracts && mainnetContracts.contracts.DAI}
            signer={userSigner}
            provider={mainnetProvider}
            address={address}
            blockExplorer="https://etherscan.io/"
            contractConfig={contractConfig}
            chainId={1}
          />
          {/*
            <Contract
              name="UNI"
              customContract={mainnetContracts && mainnetContracts.contracts && mainnetContracts.contracts.UNI}
              signer={userSigner}
              provider={mainnetProvider}
              address={address}
              blockExplorer="https://etherscan.io/"
            />
            */}
        </Route>
        <Route path="/subgraph">
          <Subgraph
            subgraphUri={props.subgraphUri}
            tx={tx}
            writeContracts={writeContracts}
            mainnetProvider={mainnetProvider}
          />
        </Route>
      </Switch>
    </div>
  );
}

export default App;
