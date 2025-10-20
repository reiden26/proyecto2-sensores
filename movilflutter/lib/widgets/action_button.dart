import 'package:flutter/material.dart';

class ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final bool isLoading;
  final ActionButtonType type;
  final bool isCompact;

  const ActionButton({
    super.key,
    required this.label,
    required this.icon,
    this.onPressed,
    this.isLoading = false,
    this.type = ActionButtonType.primary,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: _getShadowColor(context).withOpacity(0.2),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: isLoading ? null : onPressed,
          child: Container(
            padding: EdgeInsets.symmetric(
              horizontal: isCompact ? 12 : 16,
              vertical: isCompact ? 8 : 12,
            ),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              gradient: _getGradient(context),
              border: type == ActionButtonType.outline
                  ? Border.all(color: _getBorderColor(context), width: 1.5)
                  : null,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (isLoading)
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        _getTextColor(context),
                      ),
                    ),
                  )
                else
                  Icon(
                    icon,
                    size: isCompact ? 18 : 20,
                    color: _getTextColor(context),
                  ),
                SizedBox(width: isCompact ? 6 : 8),
                Text(
                  label,
                  style: TextStyle(
                    color: _getTextColor(context),
                    fontWeight: FontWeight.w600,
                    fontSize: isCompact ? 13 : 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  LinearGradient _getGradient(BuildContext context) {
    final theme = Theme.of(context);
    switch (type) {
      case ActionButtonType.primary:
        return LinearGradient(
          colors: [
            theme.colorScheme.primary,
            theme.colorScheme.primary.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        );
      case ActionButtonType.success:
        return LinearGradient(
          colors: [Colors.green.shade600, Colors.green.shade500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        );
      case ActionButtonType.danger:
        return LinearGradient(
          colors: [Colors.red.shade600, Colors.red.shade500],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        );
      case ActionButtonType.outline:
        return LinearGradient(
          colors: [theme.colorScheme.surface, theme.colorScheme.surface],
        );
    }
  }

  Color _getTextColor(BuildContext context) {
    final theme = Theme.of(context);
    switch (type) {
      case ActionButtonType.primary:
        return theme.colorScheme.onPrimary;
      case ActionButtonType.success:
        return Colors.white;
      case ActionButtonType.danger:
        return Colors.white;
      case ActionButtonType.outline:
        return theme.colorScheme.primary;
    }
  }

  Color _getBorderColor(BuildContext context) {
    final theme = Theme.of(context);
    return theme.colorScheme.primary.withOpacity(0.3);
  }

  Color _getShadowColor(BuildContext context) {
    final theme = Theme.of(context);
    switch (type) {
      case ActionButtonType.primary:
        return theme.colorScheme.primary;
      case ActionButtonType.success:
        return Colors.green.shade600;
      case ActionButtonType.danger:
        return Colors.red.shade600;
      case ActionButtonType.outline:
        return theme.colorScheme.primary;
    }
  }
}

enum ActionButtonType { primary, success, danger, outline }

// Widget para botones de acción en el AppBar
class AppBarActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final bool isLoading;
  final ActionButtonType type;

  const AppBarActionButton({
    super.key,
    required this.label,
    required this.icon,
    this.onPressed,
    this.isLoading = false,
    this.type = ActionButtonType.primary,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ActionButton(
        label: label,
        icon: icon,
        onPressed: onPressed,
        isLoading: isLoading,
        type: type,
        isCompact: true,
      ),
    );
  }
}
