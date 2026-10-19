/**
 * Text that meets imagery always sits on a scrim (black → transparent, 85 % on the text side) or a solid plate.
 * side: 'bl' | 'tl' | 'l' | 'b'
 */
export default function Scrim({ side = 'bl', as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`scrim-${side} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
