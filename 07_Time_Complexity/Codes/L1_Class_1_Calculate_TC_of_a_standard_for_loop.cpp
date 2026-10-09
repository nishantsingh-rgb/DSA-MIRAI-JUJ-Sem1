#include <iostream>
using namespace std;

int main() {
    int n = 10;
    int count = 0;

    for (int i = 1; i <= n; i++) {
        count++;
    }

    cout << "N = " << n << endl;
    cout << "Loop body ran " << count << " times" << endl;
    cout << "Steps grow in step with N, so TC = O(N)" << endl;
    return 0;
}
