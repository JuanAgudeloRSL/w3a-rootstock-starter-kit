"use client";
import { ADAPTER_EVENTS, CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { decodeToken, Web3Auth } from "@web3auth/single-factor-auth";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, UserCredential } from "firebase/auth";
import { useEffect, useState } from "react";
import RPC from "./ethersRPC";

const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ";
const verifier = "w3a-firebase-demo";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x1f",
  rpcTarget: "https://public-node.testnet.rsk.co",
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://rootstock-testnet.blockscout.com",
  ticker: "tRBTC",
  tickerName: "rootstock-testnet",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  privateKeyProvider,
});

const firebaseConfig = {
  apiKey: "AIzaSyB0nd9YsPLu-tpdCrsXn8wgsWVAiYEpQ_E",
  authDomain: "web3auth-oauth-logins.firebaseapp.com",
  projectId: "web3auth-oauth-logins",
  storageBucket: "web3auth-oauth-logins.appspot.com",
  messagingSenderId: "461819774167",
  appId: "1:461819774167:web:e74addfb6cc88f3b5b9c92",
};

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const app = initializeApp(firebaseConfig);

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.init();
        setProvider(web3auth.provider);

        if (web3auth.status === ADAPTER_EVENTS.CONNECTED) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
      const auth = getAuth(app);
      const googleProvider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, googleProvider);
      console.log(res);
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const login = async () => {
    if (!web3auth) {
      uiConsole("web3auth initialised yet");
      return;
    }

    const loginRes = await signInWithGoogle();
    const idToken = await loginRes.user.getIdToken(true);
    const { payload } = decodeToken(idToken);

    const web3authProvider = await web3auth.connect({
      verifier,
      verifierId: (payload as any).sub,
      idToken,
    });

    if (web3authProvider) {
      setLoggedIn(true);
      setProvider(web3authProvider);
    }
  };

  const getUserInfo = async () => {
    const user = await web3auth.getUserInfo();
    uiConsole(user);
  };

  const logout = async () => {
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
    uiConsole("logged out");
  };

  const getAccounts = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const address = await RPC.getAccounts(provider);
    uiConsole(address);
  };

  const getBalance = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const balance = await RPC.getBalance(provider);
    uiConsole(balance);
  };

  const signMessage = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const signedMessage = await RPC.signMessage(provider);
    uiConsole(signedMessage);
  };

  const sendTransaction = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    uiConsole("Sending Transaction...");
    const transactionReceipt = await RPC.sendTransaction(provider);
    uiConsole(transactionReceipt);
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
    console.log(...args);
  }

  const loggedInView = (
    <div className="grid gap-4 p-4">
      <button onClick={getUserInfo} className="bg-accent text-accent-foreground py-2 px-4 rounded">
        Get User Info
      </button>
      <button onClick={getAccounts} className="bg-accent text-accent-foreground py-2 px-4 rounded">
        Get Accounts
      </button>
      <button onClick={getBalance} className="bg-accent text-accent-foreground py-2 px-4 rounded">
        Get Balance
      </button>
      <button onClick={signMessage} className="bg-accent text-accent-foreground py-2 px-4 rounded">
        Sign Message
      </button>
      <button onClick={sendTransaction} className="bg-accent text-accent-foreground py-2 px-4 rounded">
        Send Transaction
      </button>
      <button onClick={logout} className="bg-destructive text-destructive-foreground py-2 px-4 rounded">
        Log Out
      </button>
    </div>
  );

  const unloggedInView = (
    <button onClick={login} className="bg-primary text-primary-foreground py-2 px-4 rounded">
      Login
    </button>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">
        <a target="_blank" href="https://web3auth.io/docs/sdk/core-kit/sfa-web" rel="noreferrer" className="underline">
          Web3Auth
        </a>{" "}
        &{" "}
        <a href="#" className="underline">
          Rootstock
        </a>
      </h1>

      <div className="grid justify-center">{loggedIn ? loggedInView : unloggedInView}</div>

      <div id="console" className="mt-8 text-sm text-muted-foreground">
        <p></p>
      </div>

      <footer className="mt-12 text-center text-muted-foreground">
        <a
          href="https://github.com/Web3Auth/web3auth-core-kit-examples/tree/main/single-factor-auth-web/quick-starts/sfa-nextjs-quick-start"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;
