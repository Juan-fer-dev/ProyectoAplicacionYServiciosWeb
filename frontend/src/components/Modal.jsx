export default function Modal({ titulo, onClose, children, className = '' }) {
  return (
    <div className="modal-overlay">
      <div className={`modal${className ? ' ' + className : ''}`}>
        <div className="modal-header">
          <h2>{titulo}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}