import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Index = () => {
	const SocialLoginDynamic = dynamic(
		() => import('../components/Scw').then((res) => res.default),
		{
			ssr: false,
		}
	);

	return (
		<div>
			<Suspense fallback={<div>Loading...</div>}>
				<SocialLoginDynamic />
			</Suspense>
		</div>
	);
};

export default Index;
