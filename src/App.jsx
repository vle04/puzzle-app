import { useState } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [displayImg, setDisplayImg] = useState(false);
  const [pieces, setPieces] = useState([]);

  // handles image upload from user
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
    };
    reader.readAsDataURL(file);

    setDisplayImg(true);
  };

  // creates the puzzle pieces from an image
  const makePuzzle = () => {
    console.log("button clicked");
    const MAX_SIZE = 800;
    const COLS = 5;
    const img = new Image();

    img.onload = () => {
      // calculate puzzle dimensions based on image ratio
      const scale = Math.min(
        MAX_SIZE / img.naturalWidth,
        MAX_SIZE / img.naturalHeight,
      );
      const puzzleWidth = Math.round(img.naturalWidth * scale);
      const puzzleHeight = Math.round(img.naturalHeight * scale);

      // calculate rows based on ratio so pieces stay roughly square
      const ROWS = Math.round(COLS * (puzzleHeight / puzzleWidth));
      const pieceWidth = puzzleWidth / COLS;
      const pieceHeight = puzzleHeight / ROWS;

      // draw the img onto canvas at scaled size
      const canvas = document.createElement("canvas");
      canvas.width = puzzleWidth;
      canvas.height = puzzleHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, puzzleWidth, puzzleHeight);

      // slice into pieces!
      const pieces = [];
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const pieceCanvas = document.createElement("canvas");
          pieceCanvas.width = pieceWidth;
          pieceCanvas.height = pieceHeight;
          const pieceCtx = pieceCanvas.getContext("2d");

          pieceCtx.drawImage(
            canvas,
            col * pieceWidth,
            row * pieceHeight,
            pieceWidth,
            pieceHeight,
            0,
            0,
            pieceWidth,
            pieceHeight,
          );

          pieces.push({
            id: row * COLS + col,
            imageData: pieceCanvas.toDataURL(),
            correctCol: col,
            correctRow: row,
          });
        }
      }

      // shuffle + store pieces
      const shuffled = [...pieces].sort(() => Math.random() - 0.5);
      setPieces(shuffled);
      setDisplayImg(false);
      console.log(shuffled);
    };

    img.src = image;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px",
        gap: "24px",
      }}
    >
      <h1>puzzle!</h1>

      <input type="file" accept="image/*" onChange={handleUpload} />

      {displayImg && (
        <img
          src={image}
          alt="uploaded"
          style={{ maxWidth: "800px", maxHeight: "800px", borderRadius: "8px" }}
        />
      )}

      {pieces.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            maxWidth: "800px",
          }}
        >
          {pieces.map((piece) => (
            <img
              key={piece.id}
              src={piece.imageData}
              alt={`piece ${piece.id}`}
              style={{ width: "90px", height: "90px", objectFit: "cover" }}
            />
          ))}
        </div>
      )}

      <button onClick={makePuzzle}>make puzzle</button>
    </div>
  );
}

export default App;
