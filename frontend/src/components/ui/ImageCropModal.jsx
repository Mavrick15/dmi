import { useState, useRef, useEffect } from 'react';
import Button from './Button';
import AnimatedModal from './AnimatedModal';
import Icon from '../AppIcon';

const ImageCropModal = ({ isOpen, onClose, imageSrc, onCrop, aspectRatio = 1 }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen && imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
        // Calculer la position initiale pour centrer l'image
        const container = containerRef.current;
        if (container) {
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;
          const imgAspect = img.width / img.height;
          const containerAspect = containerWidth / containerHeight;
          
          let initialScale = 1;
          if (imgAspect > containerAspect) {
            initialScale = containerHeight / img.height;
          } else {
            initialScale = containerWidth / img.width;
          }
          
          setScale(initialScale);
          setPosition({ x: 0, y: 0 });
          setRotation(0);
        }
      };
      img.src = imageSrc;
    }
  }, [isOpen, imageSrc]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleCrop = (e) => {
    // Empêcher la soumission du formulaire parent
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    const container = containerRef.current;
    
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientWidth / aspectRatio;
    
    // Définir la taille du canvas (haute résolution pour une meilleure qualité)
    const outputSize = 400;
    canvas.width = outputSize;
    canvas.height = outputSize / aspectRatio;

    // Calculer le ratio de mise à l'échelle
    const scaleRatio = outputSize / containerWidth;

    // Calculer les dimensions de l'image transformée dans le conteneur
    const imgWidth = img.width * scale;
    const imgHeight = img.height * scale;

    // Calculer la position de l'image dans le conteneur (position relative au centre)
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const imgX = centerX + position.x - imgWidth / 2;
    const imgY = centerY + position.y - imgHeight / 2;

    // Convertir les coordonnées au format canvas
    const canvasImgX = imgX * scaleRatio;
    const canvasImgY = imgY * scaleRatio;
    const canvasImgWidth = imgWidth * scaleRatio;
    const canvasImgHeight = imgHeight * scaleRatio;

    // Sauvegarder le contexte
    ctx.save();

    // Remplir le canvas avec un fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Appliquer la rotation autour du centre du canvas
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;
    ctx.translate(canvasCenterX, canvasCenterY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvasCenterX, -canvasCenterY);

    // Dessiner l'image
    ctx.drawImage(img, canvasImgX, canvasImgY, canvasImgWidth, canvasImgHeight);

    // Restaurer le contexte
    ctx.restore();

    // Convertir en blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        onCrop(file);
        onClose();
      }
    }, 'image/jpeg', 0.95);
  };

  if (!isOpen) return null;

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} usePortal={true}>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Recadrer l'image
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ajustez l'image puis validez</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            type="button"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Image Container */}
        <div className="flex-1 p-6 overflow-auto flex items-center justify-center">
          <div 
            ref={containerRef}
            className="relative bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700"
            style={{ 
              width: '100%', 
              maxWidth: '400px',
              aspectRatio: aspectRatio,
              cursor: isDragging ? 'grabbing' : 'grab',
              minHeight: '300px'
            }}
            onMouseDown={handleMouseDown}
          >
            {imageLoaded && imageRef.current && (
              <img
                src={imageSrc}
                alt="Crop preview"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                  maxWidth: 'none',
                  height: 'auto',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  willChange: 'transform'
                }}
                draggable={false}
              />
            )}
            {!imageLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-primary bg-slate-50/50 dark:bg-slate-800/30 m-2">
                <Icon name="Loader2" size={28} className="animate-spin text-primary" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Chargement…</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                type="button"
                iconName="ZoomOut"
                iconPosition="left"
              >
                Zoom -
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= 3}
                type="button"
                iconName="ZoomIn"
                iconPosition="left"
              >
                Zoom +
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                type="button"
                iconName="RotateCw"
                iconPosition="left"
              >
                Rotation
              </Button>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Zoom: {(scale * 100).toFixed(0)}%
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="ghost" 
              onClick={onClose}
              type="button"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCrop}
              disabled={!imageLoaded}
              iconName="Check"
              type="button"
            >
              Valider
            </Button>
          </div>
        </div>

        {/* Hidden Canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </AnimatedModal>
  );
};

export default ImageCropModal;

