import { useEffect } from 'react';
import { useUI } from '../store/ui';
import LightsOn from '../sections/LightsOn';
import Walkaround from '../sections/Walkaround';
import Launch from '../sections/Launch';
import TheWall from '../sections/TheWall';
import Flight from '../sections/Flight';
import Charge from '../sections/Charge';
import Variants from '../sections/Variants';
import RoadTo2028 from '../sections/RoadTo2028';
import ConfigureTeaser from '../sections/ConfigureTeaser';
import Footer from '../components/Footer';

export default function Home() {
  useEffect(() => {
    useUI.getState().setSceneMode('home');
    document.title = 'Roadster · Reveal Night — a design concept by Zeltrion Solutions';
  }, []);

  return (
    <>
      <LightsOn />
      <Walkaround />
      <Launch />
      <TheWall />
      <Flight />
      <Charge />
      <Variants />
      <RoadTo2028 />
      <ConfigureTeaser />
      <Footer />
    </>
  );
}

