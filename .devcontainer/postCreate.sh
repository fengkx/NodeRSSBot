REPOSRC='https://github.com/fengkx/dotfiles'
LOCALREPO="$HOME/dotfiles"
LOCALREPO_VC_DIR=$LOCALREPO/.git

if [ ! -d $LOCALREPO_VC_DIR ]
then
    git clone $REPOSRC $LOCALREPO
    cd $LOCALREPO
    zsh "$LOCALREPO/script/setup"
else
    cd $LOCALREPO
    git pull $REPOSRC
fi
