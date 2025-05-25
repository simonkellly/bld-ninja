const videoLinks = [
  'https://www.youtube.com/embed/dStn_iV9GN4',
  'https://www.youtube.com/embed/OqPxaKs8xrk',
  'https://www.youtube.com/embed/wi8PMIPzZ94',
  'https://www.youtube.com/embed/X8JryvsDzA4',
  'https://www.youtube.com/embed/YYxzH-CcPhM',
  'https://www.youtube.com/embed/GG11lZ_K3LY',
  'https://www.youtube.com/embed/REuKymvrrqk',
  'https://www.youtube.com/embed/yYZmVhsj4Qc',
  'https://www.youtube.com/embed/intRX7BRA90',
  'https://www.youtube.com/embed/fw4usGBQeco',
  'https://www.youtube.com/embed/Eu3pqcZu0I4',
  'https://www.youtube.com/embed/Vpuzw8Pi2zM',
  'https://www.youtube.com/embed/w_DQoANoE6c',
  'https://www.youtube.com/embed/fMRxm7AE3r8',
  'https://www.youtube.com/embed/MgWbntKZ3ds',
  'https://www.youtube.com/embed/7Vh8HD99qJA',
  'https://www.youtube.com/embed/9nmsxCqsRNE',
  'https://www.youtube.com/embed/AKryiQo4z7w',
  'https://www.youtube.com/embed/Lt-k-1eD5bE',
  'https://www.youtube.com/embed/0xEap2miGzI',
  'https://www.youtube.com/embed/E7cfsnmlSFs',
  'https://www.youtube.com/embed/2f1gNmfuVes',
  'https://www.youtube.com/embed/9OiJvQkK008',
  'https://www.youtube.com/embed/X9MZl0aldKw',
  'https://www.youtube.com/embed/O5HIFf-F0sU',
  'https://www.youtube.com/embed/rCULOF5VCqQ',
  'https://www.youtube.com/embed/JlPEb6WNuDI',
  'https://www.youtube.com/embed/D7Mj-s11jak',
  'https://www.youtube.com/embed/uM_rLZtCJpg',
  'https://www.youtube.com/embed/ugpdb0pKerc',
  'https://www.youtube.com/embed/Votf9eKAVxs',
  'https://www.youtube.com/embed/ULGXxx_-jtY',
  'https://www.youtube.com/embed/BkNZpZsGp74',
  'https://www.youtube.com/embed/3G0hEpRG6AM',
  'https://www.youtube.com/embed/vMfIpv5sX1M',
  'https://www.youtube.com/embed/GnQC9XguMl0',
  'https://www.youtube.com/embed/dWEuejhh7Gk',
  'https://www.youtube.com/embed/nS_ywDblNyo',
  'https://www.youtube.com/embed/M9QECFogqYM',
  'https://www.youtube.com/embed/TLmljh24Emc',
  'https://www.youtube.com/embed/jmTho4ORynY',
  'https://www.youtube.com/embed/X4_vRiP44Go',
];

export default function Placeholder() {
  const randomVideo = videoLinks[Math.floor(Math.random() * videoLinks.length)];

  return (
    <div className="bg-card rounded-lg border col-span-1 h-full w-1/3 overflow-hidden">
      <iframe
        width="100%"
        height="100%"
        src={randomVideo + '?autoplay=1&mute=1&modestbranding=1&controls=0'}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
