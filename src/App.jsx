import { useState } from "react";
import { motion } from "framer-motion";

function App() {
  const [image, setImage] = useState(null);
  const [displayImg, setDisplayImg] = useState(false);
  const [pieces, setPieces] = useState([]);
  const [puzzleDimensions, setPuzzleDimensions] = useState({
    width: 0,
    height: 0,
    cols: 0,
    rows: 0,
  });
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [solved, setSolved] = useState(false);

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
    const MAX_SIZE = 650;
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
      const shuffled = [...pieces]
        .map((piece) => ({
          ...piece,
          x: Math.random() * (puzzleWidth - pieceWidth), // random starting position
          y: Math.random() * (puzzleHeight - pieceHeight),
          placed: false,
        }))
        .sort(() => Math.random() - 0.5);

      setPieces(shuffled);
      setPuzzleDimensions({
        width: puzzleWidth,
        height: puzzleHeight,
        cols: COLS,
        rows: ROWS,
      });
      setDisplayImg(false);
    };

    img.src = image;
  };

  // snapping logic
  const handleDragEnd = (e, info, piece) => {
    const pieceWidth = puzzleDimensions.width / puzzleDimensions.cols;
    const pieceHeight = puzzleDimensions.height / puzzleDimensions.rows;

    const correctX = piece.correctCol * pieceWidth;
    const correctY = piece.correctRow * pieceHeight;

    const container = document.getElementById("puzzle-container");

    const distance = Math.sqrt(
      Math.pow(piece.x - correctX, 2) + Math.pow(piece.y - correctY, 2),
    );

    // use half the piece size as threshold so anywhere on the piece counts
    const threshold = Math.min(pieceWidth, pieceHeight) / 2;

    if (distance < threshold) {
      setPieces((prev) => {
        const updated = prev.map((p) =>
          p.id === piece.id
            ? { ...p, x: correctX, y: correctY, placed: true }
            : p,
        );

        // check if every piece has been placed
        if (updated.every((p) => p.placed)) {
          setSolved(true);
        }

        return updated;
      });
    }
  };

  const handleDrag = (e, info, piece) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === piece.id
          ? { ...p, x: p.x + info.delta.x, y: p.y + info.delta.y }
          : p,
      ),
    );
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
            position: "relative",
            width: puzzleDimensions.width,
            height: puzzleDimensions.height,
            border: "1px solid #333",
            // overflow: "hidden",
          }}
          id="puzzle-container"
        >
          {pieces.map((piece) => (
            <motion.img
              key={piece.id}
              src={piece.imageData}
              alt={`piece ${piece.id}`}
              style={{
                position: "absolute",
                width: puzzleDimensions.width / puzzleDimensions.cols,
                height: puzzleDimensions.height / puzzleDimensions.rows,
                cursor: "grab",
                boxSizing: "border-box",
                zIndex: draggedPiece === piece.id ? 100 : piece.placed ? 1 : 2,
              }}
              drag={!piece.placed}
              onDrag={(e, info) => handleDrag(e, info, piece)}
              whileDrag={{ scale: 1.05, zIndex: 10 }}
              dragMomentum={false}
              initial={{ x: piece.x, y: piece.y }}
              animate={piece.placed ? { x: piece.x, y: piece.y } : undefined}
              onDragStart={() => setDraggedPiece(piece.id)}
              onDragEnd={(e, info) => {
                handleDragEnd(e, info, piece);
                setDraggedPiece(null);
              }}
            />
          ))}
        </div>
      )}

      <button onClick={makePuzzle}>make puzzle</button>

      {solved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            borderRadius: "8px",
            zIndex: 200,
          }}
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
            style={{ fontSize: "64px" }}
          >
            🎉
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ color: "#fff", fontSize: "32px", marginTop: "16px" }}
          >
            puzzle solved!
          </motion.h2>
          <motion.button
            onClick={() => {
              setSolved(false);
              makePuzzle();
            }}
          >
            reset
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

export default App;
