import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface ProtectedActionProps {
  to: string;
  allowedRoles?: UserRole[];
  requiredRole?: UserRole;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onAction?: () => void;
}

/**
 * ProtectedAction wrapper component:
 * If no user session exists and the user clicks this tile/button,
 * intercepts and redirects to /auth, passing the intended destination in router state.
 */
export const ProtectedAction: React.FC<ProtectedActionProps> = ({
  to,
  requiredRole,
  children,
  className = '',
  disabled = false,
  onAction,
}) => {
  const { isAuthenticated, user, role } = useAuth();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;

    if (!isAuthenticated || !user) {
      // Redirect to /auth with the intended destination in router state
      navigate('/auth', { state: { from: to } });
      return;
    }

    // Role check if applicable
    if (requiredRole && role !== requiredRole) {
      // User is authenticated but wrong role; navigate to destination where ProtectedRoute displays the role switch prompt
      navigate(to);
      return;
    }

    if (onAction) {
      onAction();
    } else {
      navigate(to);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as any);
        }
      }}
    >
      {children}
    </div>
  );
};
