import React from 'react';
import { History, RotateCcw, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';

const VersionHistoryModal = ({ isOpen, onClose, history, onRevert, title = "Version History" }) => {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#161616] border-white/20 max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center">
              <History className="h-5 w-5 mr-2 text-teal-400" />
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {history && history.length > 0 ? (
            history.map((version, index) => (
              <Card key={version.id || index} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Preview */}
                    <div className="flex-shrink-0">
                      {version.image ? (
                        <img
                          src={version.image}
                          alt={`Version ${index + 1}`}
                          className="w-24 h-16 object-cover rounded border border-white/20"
                          onError={(e) => {
                            e.target.src = "https://picsum.photos/200/120?grayscale";
                          }}
                        />
                      ) : version.video ? (
                        <video
                          src={version.video}
                          className="w-24 h-16 object-cover rounded border border-white/20"
                          controls
                        />
                      ) : null}
                    </div>

                    {/* Version Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">
                            Version {history.length - index}
                            {index === 0 && (
                              <span className="ml-2 text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded border border-teal-500/30">
                                Current
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {formatTimestamp(version.timestamp)}
                          </p>
                        </div>

                        {index !== 0 && (
                          <Button
                            size="sm"
                            onClick={() => onRevert(version)}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Revert
                          </Button>
                        )}
                      </div>

                      {/* Modification Prompt */}
                      {version.prompt && (
                        <div className="bg-white/5 rounded p-2 border border-white/10">
                          <p className="text-xs text-gray-400 mb-1">Modification Prompt:</p>
                          <p className="text-sm text-white">{version.prompt}</p>
                        </div>
                      )}

                      {/* Style/Type Info */}
                      {version.style && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">Style:</span>
                          <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded">
                            {version.style}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No version history available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VersionHistoryModal;