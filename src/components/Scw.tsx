import styles from '../styles/Home.module.css';
import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ChainId } from '@biconomy/core-types';
import SocialLogin from '@biconomy/web3-auth';
import SmartAccount from '@biconomy/smart-account';
import ABI from '@/constants/ABI';
import DeployedAddress from '@/constants/DeployedAddress';

const Home = () => {
	const [provider, setProvider] = useState<any>();
	const [account, setAccount] = useState<string>();
	const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null);
	const [scwAddress, setScwAddress] = useState('');
	const [scwLoading, setScwLoading] = useState(false);
	const [socialLoginSDK, setSocialLoginSDK] = useState<SocialLogin | null>(
		null
	);

	const connectWeb3 = useCallback(async () => {
		if (typeof window === 'undefined') return;
		console.log('socialLoginSDK', socialLoginSDK);
		if (socialLoginSDK?.provider) {
			console.log('provider already exists');
			const web3Provider = new ethers.providers.Web3Provider(
				socialLoginSDK.provider
			);
			setProvider(web3Provider);
			const accounts = await web3Provider.listAccounts();
			console.log('accounts are: ', accounts);
			setAccount(accounts[0]);
			return;
		}
		if (socialLoginSDK) {
			socialLoginSDK.showWallet();
			return socialLoginSDK;
		}
		const sdk = new SocialLogin();
		await sdk.init({
			chainId: ethers.utils.hexValue(80001),
		});
		setSocialLoginSDK(sdk);
		sdk.showWallet();
		return socialLoginSDK;
	}, [socialLoginSDK]);

	// if wallet already connected close widget
	useEffect(() => {
		console.log('hide wallet');
		if (socialLoginSDK && socialLoginSDK.provider) {
			socialLoginSDK.hideWallet();
		}
	}, [account, socialLoginSDK]);

	// after metamask login -> get provider event
	useEffect(() => {
		const interval = setInterval(async () => {
			if (account) {
				clearInterval(interval);
			}
			if (socialLoginSDK?.provider && !account) {
				connectWeb3();
			}
		}, 1000);
		return () => {
			clearInterval(interval);
		};
	}, [account, connectWeb3, socialLoginSDK]);

	const disconnectWeb3 = async () => {
		if (!socialLoginSDK || !socialLoginSDK.web3auth) {
			console.error('Web3Modal not initialized.');
			return;
		}
		await socialLoginSDK.logout();
		socialLoginSDK.hideWallet();
		setProvider(undefined);
		setAccount(undefined);
		setScwAddress('');
	};

	useEffect(() => {
		async function setupSmartAccount() {
			setScwAddress('');
			setScwLoading(true);
			const smartAccount = new SmartAccount(provider, {
				activeNetworkId: ChainId.GOERLI,
				supportedNetworksIds: [ChainId.GOERLI],
			});
			await smartAccount.init();
			const context = smartAccount.getSmartAccountContext();
			setScwAddress(context.baseWallet.getAddress());
			setSmartAccount(smartAccount);
			setScwLoading(false);
		}
		if (!!provider && !!account) {
			setupSmartAccount();
			console.log('Provider...', provider);
		}
	}, [account, provider]);

	const readValueFunction = () => {
		let contract = new ethers.Contract(DeployedAddress, ABI, provider);

		contract
			.get()
			.then((val: any) => {
				console.log('fetched value is: ', val);
			})
			.catch((err: object) =>
				console.log('Printing error msg at getText function: ', err)
			);
	};

	const writeValueFunction = () => {
		let contract = new ethers.Contract(
			DeployedAddress,
			ABI,
			provider.getSigner()
		);
		contract
			.setGreeting('jai maa lakshmi')
			.then((tx: any) => {
				console.log('transaction occured : ', tx.hash);
				return tx
					.wait()
					.then(() => {
						console.log('text overwritten successfully');
					})
					.catch((err: any) =>
						console.log(
							'Printing error msg in overwritting text -1: ',
							err.message
						)
					);
			})
			.catch((err: any) => {
				console.log('Printing error msg in transaction hash -2: ', err.message);
			});
	};

	return (
		<div className={styles.container}>
			<main className={styles.main}>
				<h1>Biconomy SDK Next.js Web3Auth Example</h1>
				<button onClick={!account ? connectWeb3 : disconnectWeb3}>
					{!account ? 'Connect Wallet' : 'Disconnect Wallet'}
				</button>

				{account && (
					<div>
						<h2>EOA Address</h2>
						<p>{account}</p>
					</div>
				)}

				{scwLoading && <h2>Loading Smart Account...</h2>}

				{scwAddress && (
					<div>
						<h2>Smart Account Address</h2>
						<p>{scwAddress}</p>
					</div>
				)}
				<button onClick={readValueFunction}>read value Function</button>
				<button onClick={writeValueFunction}>write value Function</button>
			</main>
		</div>
	);
};

export default Home;
