import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>SOLottery</title>
        <meta
          name="description"
          content="SOLottery"
        />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
